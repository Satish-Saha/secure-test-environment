"use client";

import { enqueueEvents, getAndClearBatch, hasPendingEvents } from "./eventQueue";
import { createEvent, getOrCreateAttemptId } from "./eventSchema";
import { isSubmitted, setSubmittedFlag, setSubmittingFlag, clearSubmittingFlag } from "./localStorageSync";

const BATCH_SIZE = 5;
const BATCH_INTERVAL_MS = 5000;

let intervalId = null;

/**
 * Client-side deduplication strategy:
 * 
 * LAYER 1: oncePerAttemptEvents - Prevent logEvent() from queuing the same event type twice
 *          (e.g., BROWSER_DETECTED only logged once per attempt)
 * 
 * LAYER 2: eventId (in eventSchema.js) - Every event gets a unique UUID
 * 
 * LAYER 3: Backend deduplication (in /api/logs) - Server tracks eventIds and ignores duplicates
 *          This handles: network retries, serverless function retries, client re-submissions
 * 
 * Why both layers? 
 * - Client prevents noisy events (FULLSCREEN_EXIT, FOCUS_LOST) from queuing excessively
 * - Backend is the source of truth: even if client queues duplicate, backend discards it
 * - Idempotent design: retrying the same batch POST multiple times yields the same result
 */

const oncePerAttemptEvents = new Set([
  "TIMER_STARTED",
  "BROWSER_DETECTED",
  "ASSESSMENT_SUBMITTED",
  "COPY_ATTEMPT",
  "CUT_ATTEMPT",
  "PASTE_ATTEMPT"
]);

const firedOnce = new Set();

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

  if (oncePerAttemptEvents.has(eventType)) {
    if (firedOnce.has(eventType)) return;
    firedOnce.add(eventType);
  }

  const ev = createEvent(eventType, { metadata });
  enqueueEvents([ev]);
}

export function startBatchSender() {
  if (typeof window === "undefined" || isSubmitted()) return;

  // Global guard: only start once, never again
  if (window.__batchSenderStarted) return;
  window.__batchSenderStarted = true;

  intervalId = window.setInterval(async () => {
    if (!hasPendingEvents()) return;
    const batch = getAndClearBatch(BATCH_SIZE);
    await sendBatchToServer(batch, false);
  }, BATCH_INTERVAL_MS);
}

export async function flushAndSubmit() {
  if (typeof window === "undefined") return;
  if (isSubmitted()) return;

  // Set submitting flag immediately to prevent re-entry and timer restart
  setSubmittingFlag();

  // send everything that is currently queued and mark as submitted
  const all = [];
  let batch = getAndClearBatch(BATCH_SIZE);

  while (batch.length > 0) {
    all.push(...batch);
    batch = getAndClearBatch(BATCH_SIZE);
  }

  // ✅ Always add submission event last
  all.push(createEvent("ASSESSMENT_SUBMITTED"));

  try {
    // Send everything to backend
    await sendBatchToServer(all, true);

    // Backend success → Final immutable submission flag
    setSubmittedFlag();

    //Clear temporary lock
    clearSubmittingFlag();
  } catch (err) {
    // ❌ Network/server failed → allow retry
    clearSubmittingFlag();

    // Put logs back into queue
    enqueueEvents(all);
  }

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}