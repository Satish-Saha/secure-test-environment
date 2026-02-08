"use client";

export function addClipboardBlockers(handler) {
  if (typeof document === "undefined") return;
  const wrap = (type) => (e) => {
    e.preventDefault();
    handler && handler(type, e);
  };

  const copy = wrap("COPY_ATTEMPT");
  const cut = wrap("CUT_ATTEMPT");
  const paste = wrap("PASTE_ATTEMPT");

  document.addEventListener("copy", copy);
  document.addEventListener("cut", cut);
  document.addEventListener("paste", paste);

  return () => {
    document.removeEventListener("copy", copy);
    document.removeEventListener("cut", cut);
    document.removeEventListener("paste", paste);
  };
}
