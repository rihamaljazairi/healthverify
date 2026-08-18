import { useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_MS = 2 * 60 * 1000;  // warn 2 minutes before

export function useSessionTimeout(isActive = true) {
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const warningShownRef = useRef(false);

  const resetTimer = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);
    warningShownRef.current = false;

    if (!isActive || !auth.currentUser) return;

    // Warning before logout
    warningRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        const stay = window.confirm(
          "⚠️ You will be logged out in 2 minutes due to inactivity.\n\nClick OK to stay logged in."
        );
        if (stay) resetTimer();
      }
    }, TIMEOUT_MS - WARNING_MS);

    // Auto logout
    timeoutRef.current = setTimeout(async () => {
      await signOut(auth);
      window.location.href = "/";
    }, TIMEOUT_MS);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
    };
  }, [isActive, resetTimer]);
}