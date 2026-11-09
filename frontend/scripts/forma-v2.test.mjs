import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const frontend = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, frontend), "utf8");
const tokens = read("tokens.css");
const styles = readdirSync(new URL("styles/", frontend))
  .filter((file) => file.endsWith(".css"))
  .map((file) => read(`styles/${file}`)).join("\n");
const declarations = (css) => Object.fromEntries(
  [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value]),
);
const root = declarations(tokens.slice(tokens.indexOf(":root {"), tokens.indexOf("html[data-theme=")));
const palettes = {
  light: ["#f4f7f4", "#ffffff", "#12211a", "#3d4f46", "#0f6e4c", "#0f6e4c", "#ffffff"],
  dark: ["#12120e", "#1a1a15", "#f2f0e8", "#cbc8bc", "#62e6a7", "#62e6a7", "#0d1f16"],
};
const keys = ["bg", "surface", "ink", "ink-2", "accent", "accent-text", "on-accent"];
const themes = Object.fromEntries(Object.keys(palettes).map((theme) => {
  const block = tokens.slice(tokens.indexOf(`html[data-theme="${theme}"]`)).match(/\{([^}]+)\}/)[1];
  return [theme, declarations(block)];
}));

function rgb(color, background) {
  if (color.startsWith("#")) return color.slice(1).match(/../g).map((channel) => parseInt(channel, 16));
  const [r, g, b, alpha] = color.match(/[\d.]+/g).map(Number);
  return [r, g, b].map((channel, i) => Math.round(channel * alpha + background[i] * (1 - alpha)));
}
function luminance(color) {
  return rgb(color).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(foreground, background) {
  const composed = rgb(foreground, rgb(background));
  const hex = "#" + composed.map((channel) => channel.toString(16).padStart(2, "0")).join("");
  const [high, low] = [luminance(hex), luminance(background)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

for (const [theme, expected] of Object.entries(palettes)) {
  test(`${theme}: exact Eva palette and readable text, controls and focus`, () => {
    const palette = themes[theme];
    assert.deepEqual(keys.map((key) => palette[`--jk-${key}`]), expected);
    for (const background of ["bg", "surface"]) {
      for (const foreground of ["ink", "ink-2", "t2", "t3", "accent-text"]) {
        const ratio = contrast(palette[`--jk-${foreground}`], palette[`--jk-${background}`]);
        assert.ok(ratio >= 4.5, `${theme} ${foreground}/${background}: ${ratio.toFixed(2)}`);
      }
    }
    for (const accent of ["accent", "accent-hover"]) {
      assert.ok(contrast(palette["--jk-on-accent"], palette[`--jk-${accent}`]) >= 4.5);
      assert.ok(contrast(palette[`--jk-${accent}`], palette["--jk-bg"]) >= 3);
    }
    if (theme === "dark") {
      const [r, g, b] = rgb(palette["--jk-bg"]);
      assert.ok(r >= g && g >= b, "dark background stays warm");
    }
  });
}

test("Forma rhythm and motion tokens retain their specified values", () => {
  for (const [key, value] of Object.entries({
    "fs-body": "17px", "fs-lede": "20px", lh: "1.6", s20: "80px", s24: "96px", s32: "128px",
    "row-pad": "12px", "row-pad-data": "9px", "group-gap": "48px", "hero-gap": "32px",
    "chapter-gap": "128px", "chapter-gap-m": "72px", measure: "64ch",
    "page-x": "clamp(20px, 6vw, 120px)", "d-1": "120ms", "d-2": "200ms", "d-3": "280ms",
    "ease-out": "cubic-bezier(0.2, 0, 0, 1)", "ease-inout": "cubic-bezier(0.4, 0, 0.2, 1)",
  })) assert.equal(root[`--jk-${key}`], value, key);
  assert.match(styles, /gap: var\(--jk-chapter-gap\)/);
  assert.match(styles, /gap: var\(--jk-chapter-gap-m\)/);
  assert.match(styles, /padding-top: var\(--jk-row-pad\)/);
});

test("only loading spinners and the short compose entrance animate", () => {
  const keyframes = [...styles.matchAll(/@keyframes\s+([\w-]+)/g)].map(([, name]) => name);
  assert.deepEqual([...new Set(keyframes)].sort(), ["compose-enter", "spin"]);
  const rules = [...styles.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, selector, body] of rules) {
    for (const [, animation] of body.matchAll(/(?<![\w-])animation:\s*([^;]+);/g)) {
      if (animation === "none") continue;
      if (animation.includes("infinite")) assert.equal(selector.trim(), ".loading-spinner");
      else assert.match(animation, /^compose-enter var\(--jk-d-2\) var\(--ease-out\) both$/);
    }
  }
  const entrance = styles.match(/@keyframes compose-enter\s*\{([\s\S]*?)\n\}/)[1];
  assert.match(entrance, /translateY\(8px\)/);
  assert.match(entrance, /opacity: 0/);
  assert.match(entrance, /opacity: 1/);
});

test("reduced motion eliminates CSS durations and delays in every layer", () => {
  const reduced = tokens.slice(tokens.indexOf("@media (prefers-reduced-motion: reduce)"));
  for (const duration of ["d-1", "d-2", "d-3"]) assert.equal(declarations(reduced)[`--jk-${duration}`], "0ms");
  for (const property of ["animation-duration", "animation-delay", "transition-duration", "transition-delay"]) {
    assert.ok(reduced.includes(`${property}: 0ms !important;`), property);
  }
  assert.match(reduced, /\*,\s*\*::before,\s*\*::after/);
  assert.match(reduced, /scroll-behavior: auto !important/);
  for (const [, value] of (tokens + styles).matchAll(/(?:animation|transition)-duration:\s*([^;]+) !important/g)) {
    assert.equal(value, "0ms", "later CSS must not re-enable reduced motion");
  }
});

test("surfaces use no pure black, brand gradient or extra blur", () => {
  assert.doesNotMatch(tokens + styles, /#0{3}(?:0{3})?\b|:\s*black\b|rgba?\(0[, ]+0[, ]+0\b/i);
  assert.doesNotMatch(styles, /var\(--gradient-brand(?:-[\w-]+)?\)/);
  const rules = [...styles.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const glass = rules.filter(([, , body]) => [...body.matchAll(/backdrop-filter:\s*([^;]+);/g)]
    .some(([, value]) => value.trim() !== "none"));
  assert.equal(glass.length, 1);
  assert.equal(glass[0][1].trim(), ".topbar");
});
