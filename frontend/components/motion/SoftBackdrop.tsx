"use client";

import { useEffect, useRef } from "react";

export default function SoftBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = ref.current;
    if (!bg) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 767px)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reducedMotion.matches || narrow.matches) {
        bg.style.transform = "";
        return;
      }
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const offset = -Math.min(window.scrollY * 0.2, viewportHeight * 0.25);
      bg.style.transform = `translate3d(0,${offset.toFixed(1)}px,0)`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    reducedMotion.addEventListener("change", update);
    narrow.addEventListener("change", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      reducedMotion.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
      window.visualViewport?.removeEventListener("resize", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="eva-soft-bg" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
