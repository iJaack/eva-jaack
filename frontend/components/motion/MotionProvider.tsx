"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

const MotionContext = createContext(false);

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  return <MotionContext.Provider value={reducedMotion}>{children}</MotionContext.Provider>;
}

export function useReducedMotion(): boolean {
  return useContext(MotionContext);
}
