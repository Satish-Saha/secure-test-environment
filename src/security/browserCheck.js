"use client";

import { getBrowserInfo } from "../logger/eventSchema";

export function isChromeBrowser() {
  if (typeof window === "undefined") return false;
  const info = getBrowserInfo();
  return info.name === "Chrome";
}

export function getBrowserDetails() {
  return getBrowserInfo();
}
