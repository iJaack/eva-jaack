"use client";

import { useReducedMotion } from "./MotionProvider";

export default function AnimatedBackdrop() {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`site-backdrop${reducedMotion ? " backdrop-static" : ""}`} aria-hidden>
      <div className="backdrop-beam" />
      <div className="backdrop-aurora backdrop-aurora-a" />
      <div className="backdrop-aurora backdrop-aurora-b" />
      <div className="backdrop-aurora backdrop-aurora-c" />
      <div className={`backdrop-mesh${reducedMotion ? " backdrop-mesh-static" : ""}`} />
      <div className="backdrop-grid" />
      <div className="backdrop-grain" />
    </div>
  );
}
