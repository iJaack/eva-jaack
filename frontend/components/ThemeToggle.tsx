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

    const mount = () => {
      if (cancelled) return;
      const theme = window.JaackTheme;
      if (!theme) {
        if (tries++ > 40) return;
        frame = window.requestAnimationFrame(mount);
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.documentElement.classList.add("jk-rm");
      }
      theme.apply(false);
      theme.mount(host);
      theme.sync();
    };

    mount();

    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={hostRef} className="eva-theme-host" />;
}
