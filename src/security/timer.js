"use client";

import { useEffect, useRef, useState } from "react";

export function useCountdown(durationSeconds, { onExpire } = {}) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const onExpireRef = useRef(onExpire);

  // Always keep latest onExpire in a ref without restarting the timer
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemaining(durationSeconds);
    if (durationSeconds <= 0) return;

    let secondsLeft = durationSeconds;
    const id = setInterval(() => {
      secondsLeft -= 1;
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(id);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(id);
  }, [durationSeconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return { remaining, minutes, seconds };
}
