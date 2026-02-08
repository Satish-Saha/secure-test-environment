"use client";

const QUEUE_KEY = "secure_logs_queue";
const ALL_EVENTS_KEY = "secure_logs_all_events";
const SUBMITTED_KEY = "secure_attempt_submitted";
const SUBMITTING_KEY = "submission_in_progress";

export function loadQueueFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQueueToStorage(queue) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function appendToAllEvents(events) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ALL_EVENTS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const merged = existing.concat(events);
    window.localStorage.setItem(ALL_EVENTS_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export function loadAllEvents() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ALL_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setSubmittedFlag() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUBMITTED_KEY, "true");
}

export function isSubmitted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SUBMITTED_KEY) === "true";
}

export function setSubmittingFlag() {
  localStorage.setItem(SUBMITTING_KEY, "true");
}

export function isSubmitting() {
  return localStorage.getItem(SUBMITTING_KEY) === "true";
}

export function clearSubmittingFlag() {
  localStorage.removeItem(SUBMITTING_KEY);
}