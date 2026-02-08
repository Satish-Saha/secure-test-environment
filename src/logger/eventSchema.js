"use client";

import { v4 as uuidv4 } from "uuid";

const ATTEMPT_ID_KEY = "secure_attempt_id";

export function getOrCreateAttemptId() {
  if (typeof window === "undefined") return "server-attempt";
  let id = window.localStorage.getItem(ATTEMPT_ID_KEY);
  if (!id) {
    id = uuidv4();
    window.localStorage.setItem(ATTEMPT_ID_KEY, id);
  }
  return id;
}

export function getBrowserInfo() {
  if (typeof window === "undefined") return { name: "unknown", version: "unknown" };
  const ua = navigator.userAgent;
  let name = "Unknown";
  let version = "";

  const chromeMatch = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+|\d+\.\d+\.\d+|\d+\.\d+)/);
  if (chromeMatch && ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) {
    name = "Chrome";
    version = chromeMatch[1];
  } else if (ua.includes("Edg")) {
    name = "Edge";
  } else if (ua.includes("Firefox")) {
    name = "Firefox";
  } else if (ua.includes("Safari")) {
    name = "Safari";
  }

  return { name, version };
}

export function createEvent(eventType, overrides = {}) {
  const attemptId = getOrCreateAttemptId();
  const { name, version } = getBrowserInfo();
  const baseMetadata = {
    browser: `${name} ${version || ""}`.trim(),
    fullscreen: !!document.fullscreenElement,
    hasFocus: typeof document !== "undefined" ? document.hasFocus() : false
  };

  return {
    // Globally unique event ID using crypto.randomUUID() for end-to-end deduplication
    // Backend will track received eventIds per attempt and ignore duplicates
    eventId: crypto.randomUUID?.() || uuidv4(),
    eventType,
    timestamp: new Date().toISOString(),
    attemptId,
    questionId: null,
    metadata: {
      ...baseMetadata,
      ...(overrides.metadata || {})
    }
  };
}
