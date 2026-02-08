"use client";

export function addFocusListeners(onFocus, onBlur) {
  if (typeof window === "undefined") return;
  if (onFocus) window.addEventListener("focus", onFocus);
  if (onBlur) window.addEventListener("blur", onBlur);
}

export function removeFocusListeners(onFocus, onBlur) {
  if (typeof window === "undefined") return;
  if (onFocus) window.removeEventListener("focus", onFocus);
  if (onBlur) window.removeEventListener("blur", onBlur);
}
