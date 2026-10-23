"use client";

import { useLayoutEffect, useRef } from "react";

type JaackThemeApi = {
  apply: (fade: boolean) => void;
  mount: (host: HTMLElement) => void;
  sync: () => void;
};

declare global {
  interface Window {
    JaackTheme?: JaackThemeApi;
  }
}

export default function ThemeSwitch() {
  const hostRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let tries = 0;
    let frame = 0;
    let removeReducedMotionListener = () => {};

    const mount = () => {
      if (cancelled) return;
      const theme = window.JaackTheme;
      if (!theme) {
        if (tries++ > 40) return;
        frame = window.requestAnimationFrame(mount);
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const syncReducedMotion = () => {
        document.documentElement.classList.toggle("jk-rm", reducedMotion.matches);
      };
      syncReducedMotion();
      reducedMotion.addEventListener("change", syncReducedMotion);
      removeReducedMotionListener = () => reducedMotion.removeEventListener("change", syncReducedMotion);
      theme.apply(false);
      theme.mount(host);
      theme.sync();
    };

    mount();

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      removeReducedMotionListener();
    };
  }, []);

  return <span ref={hostRef} className="eva-theme-host" />;
}
