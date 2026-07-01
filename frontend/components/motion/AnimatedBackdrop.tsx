"use client";

import { useReducedMotion } from "./MotionProvider";

export default function AnimatedBackdrop() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="site-backdrop" aria-hidden>
      <div className={`backdrop-mesh${reducedMotion ? " backdrop-mesh-static" : ""}`} />
      <div className="backdrop-grid" />
      <div className="backdrop-grain" />
    </div>
  );
}
