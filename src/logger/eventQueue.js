"use client";

import { loadQueueFromStorage, saveQueueToStorage, appendToAllEvents } from "./localStorageSync";

let queue = [];
let initialized = false;

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  queue = loadQueueFromStorage();
  initialized = true;
}

export function enqueueEvents(events) {
  ensureInit();
  const arr = Array.isArray(events) ? events : [events];
  queue = queue.concat(arr);
  appendToAllEvents(arr);
  saveQueueToStorage(queue);
}

export function getAndClearBatch(maxItems) {
  ensureInit();
  if (queue.length === 0) return [];
  const batch = queue.slice(0, maxItems);
  queue = queue.slice(maxItems);
  saveQueueToStorage(queue);
  return batch;
}

export function hasPendingEvents() {
  ensureInit();
  return queue.length > 0;
}

export function getQueueSnapshot() {
  ensureInit();
  return [...queue];
}
