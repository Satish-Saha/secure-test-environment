"use client";

import { enqueueEvents, getAndClearBatch, hasPendingEvents } from "./eventQueue";
import { createEvent, getOrCreateAttemptId } from "./eventSchema";
import { isSubmitted, setSubmittedFlag } from "./localStorageSync";

const BATCH_SIZE = 5;
const BATCH_INTERVAL_MS = 5000;

let intervalId = null;
let active = false;

// Debounce map for noisy events (timestamp of last occurrence)
const lastEventTime = {};
const DEBOUNCE_MS = 500;

async function sendBatchToServer(batch, markSubmitted = false) {
  if (!batch || batch.length === 0) return;
  const attemptId = getOrCreateAttemptId();
  try {
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, events: batch, markSubmitted })
    });
    if (!res.ok) {
      // re-enqueue on failure
      enqueueEvents(batch);
    } else if (markSubmitted) {
      setSubmittedFlag();
    }
  } catch {
    enqueueEvents(batch);
  }
}

export function logEvent(eventType, metadata) {
  if (isSubmitted()) return; // immutable after submission

  // Debounce noisy events
  const noisyEvents = ['FULLSCREEN_EXIT', 'FOCUS_LOST'];
  if (noisyEvents.includes(eventType)) {
    const now = Date.now();
    if (lastEventTime[eventType] && now - lastEventTime[eventType] < DEBOUNCE_MS) {
      return; // Skip this event, too soon
    }
    lastEventTime[eventType] = now;
  }

  const ev = createEvent(eventType, { metadata });
  enqueueEvents(ev);
}

export function startBatchSender() {
  if (typeof window === "undefined" || isSubmitted()) return;

  // Global guard: only start once, never again
  if (window.__batchSenderStarted) return;
  window.__batchSenderStarted = true;

  active = true;
  intervalId = window.setInterval(async () => {
    if (!hasPendingEvents()) return;
    const batch = getAndClearBatch(BATCH_SIZE);
    await sendBatchToServer(batch, false);
  }, BATCH_INTERVAL_MS);
}

export async function flushAndSubmit() {
  if (typeof window === "undefined") return;
  if (isSubmitted()) return;

  // Set submitted flag immediately to prevent re-entry and timer restart
  setSubmittedFlag();

  // send everything that is currently queued and mark as submitted
  const all = [];
  let batch = getAndClearBatch(BATCH_SIZE);
  while (batch.length > 0) {
    all.push(...batch);
    batch = getAndClearBatch(BATCH_SIZE);
  }
  if (all.length === 0) {
    // still inform backend of submission
    await sendBatchToServer([createEvent("ASSESSMENT_SUBMITTED")], true);
  } else {
    // ensure submission event is last
    all.push(createEvent("ASSESSMENT_SUBMITTED"));
    await sendBatchToServer(all, true);
  }
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  active = false;
}