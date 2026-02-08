"use client";

export function requestFullscreen(element) {
  if (!element || typeof document === "undefined") return;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

export function isFullscreen() {
  if (typeof document === "undefined") return false;
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
  );
}

export function addFullscreenChangeListener(handler) {
  if (typeof document === "undefined") return handler;
  
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  document.addEventListener("msfullscreenchange", handler);
  
  return handler;
}

export function removeFullscreenChangeListener(handler) {
  if (typeof document === "undefined") return;
  document.removeEventListener("fullscreenchange", handler);
  document.removeEventListener("webkitfullscreenchange", handler);
  document.removeEventListener("msfullscreenchange", handler);
}
