import "./style.css";
import "katex/dist/katex.min.css";

import { marked } from "marked";
import Slugger from "github-slugger";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import katex from "katex";
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

import whitepaperMd from "./content/WHITEPAPER.md?raw";

hljs.registerLanguage("json", json);
Chart.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

const els = {
  content: document.getElementById("content"),
  theme: document.getElementById("theme"),
  progressBar: document.getElementById("progressBar"),
};

const state = {
  theme: "light",
  motion: true,
  charts: new Set(),
  flows: new Set(),
  resizeObservers: new Set(),
  reveals: {
    els: [],
    io: null,
  },
  parallax: {
    root: null,
    raf: 0,
    running: false,
    layers: [],
    target: { x: 0, y: 0, scrollY: 0 },
    cur: { x: 0, y: 0, scrollY: 0 },
  },
};

const COLLAPSED_KEY = "eva_collapsed_v2";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function setTheme(next) {
  const theme = next || (state.theme === "dark" ? "light" : "dark");
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("eva_theme", theme);
  if (els.theme) {
    els.theme.textContent = "";
    els.theme.setAttribute("aria-label", theme === "dark" ? "Theme: Dark" : "Theme: Light");
    els.theme.title = theme === "dark" ? "Theme: Dark" : "Theme: Light";
  }
  restyleCharts();
  restyleFlows();
}

function initTheme() {
  const saved = localStorage.getItem("eva_theme");
  if (saved === "dark" || saved === "light") setTheme(saved);
  else setTheme("light"); // Light-first by default (ignore system preference).
  els.theme.addEventListener("click", () => setTheme());
}

function setMotion(next) {
  const motion = typeof next === "boolean" ? next : !state.motion;
  state.motion = motion;
  document.documentElement.dataset.motion = motion ? "on" : "off";
  localStorage.setItem("eva_motion", motion ? "on" : "off");
  syncParallax();
  restyleCharts();
  syncReveals();
}

function initMotion() {
  const initial = !prefersReducedMotion();
  setMotion(initial);
}

function normalizeMd(md) {
  // Preserve the paper, but add small UX niceties.
  // 1) Ensure external links open in a new tab.
  return md;
}

function renderMarkdown(md) {
  const slugger = new Slugger();

  const renderer = new marked.Renderer();
  renderer.heading = function (token) {
    const depth = token.depth;
    const id = slugger.slug(token.text || "");
    const inner = this.parser.parseInline(token.tokens);

    // Collapsing only at h2 keeps the page navigable.
    const collapse = depth === 2
      ? `<button class="collapse-btn" type="button" data-collapse="${id}" aria-expanded="true" title="Collapse/expand section">[-]</button>`
      : "";

    const link = depth <= 3 ? `<a class="heading-link" href="#${id}" aria-label="Copy link to section">#</a>` : "";

    if (depth <= 3) {
      return `<h${depth} id="${id}"><span class="heading-row">${collapse}<span>${inner}</span>${link}</span></h${depth}>`;
    }

    return `<h${depth} id="${id}">${inner}</h${depth}>`;
  };

  renderer.link = function (token) {
    const href = token.href || "";
    const inner = this.parser.parseInline(token.tokens);
    const isExternal = /^https?:\/\//i.test(href);
    const t = token.title ? ` title="${escapeAttr(token.title)}"` : "";
    const cls = isExternal ? ' class="reverse"' : "";
    const rel = isExternal ? ' rel="noopener noreferrer"' : "";
    const target = isExternal ? ' target="_blank"' : "";
    return `<a${cls} href="${escapeAttr(href)}"${t}${rel}${target}>${inner}</a>`;
  };

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: false,
    highlight(code, lang) {
      const l = (lang || "").toLowerCase();
      if (l && hljs.getLanguage(l)) return hljs.highlight(code, { language: l }).value;
      // Text diagrams look better un-highlighted.
      return escapeHtml(code);
    },
  });

  return marked.parse(md);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll("\n", " ");
}

function headingInnerHtml(h) {
  const labelEl = h?.querySelector?.(".heading-row > span");
  return labelEl ? labelEl.innerHTML : h?.innerHTML || "";
}

function buildHeroFromIntro() {
  const root = els.content;
  if (!root) return;
  if (root.querySelector(".hero")) return;

  const h1 = root.querySelector("h1");
  if (!h1) return;

  let h2 = h1.nextElementSibling;
  while (h2 && h2.tagName !== "H2") h2 = h2.nextElementSibling;
  if (!h2) return;

  // Version line is a paragraph right after the tagline H2.
  let versionEl = null;
  let n = h2.nextElementSibling;
  while (n) {
    if (n.tagName === "P" && /\bversion\b/i.test(n.textContent || "")) {
      versionEl = n;
      break;
    }
    if (n.tagName === "HR" || n.tagName === "H2") break;
    n = n.nextElementSibling;
  }

  const hero = document.createElement("header");
  hero.className = "hero lane-full";

  const kicker = document.createElement("div");
  kicker.className = "hero-kicker";
  kicker.innerHTML = headingInnerHtml(h1).trim();

  const title = document.createElement("h1");
  title.className = "hero-title";
  title.innerHTML = headingInnerHtml(h2).trim();

  const meta = document.createElement("div");
  meta.className = "hero-meta";
  if (versionEl) meta.innerHTML = versionEl.innerHTML;

  hero.append(kicker, title);
  if (meta.innerHTML.trim()) hero.append(meta);

  h1.remove();
  h2.remove();
  versionEl?.remove();

  root.prepend(hero);
}

function transformKeyListsToBlocks() {
  const targets = [
    { label: "key innovations:", listTag: "UL" },
    { label: "core principles:", listTag: "OL" },
  ];
  const tones = ["mint", "lime", "coral", "sky", "peri", "lav"];

  for (const t of targets) {
    const ps = Array.from(els.content.querySelectorAll("p"));
    const p = ps.find((x) => String(x.textContent || "").trim().toLowerCase() === t.label);
    if (!p) continue;
    const list = p.nextElementSibling;
    if (!list || list.tagName !== t.listTag) continue;

    p.classList.add("block-kicker");

    const grid = document.createElement("div");
    grid.className = "block-grid lane-wide";

    const items = Array.from(list.querySelectorAll(":scope > li"));
    items.forEach((li, i) => {
      const tone = tones[i % tones.length];
      const card = document.createElement("div");
      card.className = `block tone-${tone}`;
      card.innerHTML = li.innerHTML;
      grid.append(card);
    });

    list.replaceWith(grid);
  }
}

const LANE_CLASSES = ["lane-narrow", "lane-wide", "lane-full"];

function setLane(el, lane) {
  if (!el) return;
  for (const c of LANE_CLASSES) el.classList.remove(c);
  if (lane) el.classList.add(lane);
}

function applyEditorialLanes() {
  const root = els.content;
  if (!root) return;

  // Top-level elements (hero + initial HR, if present).
  for (const child of Array.from(root.children)) {
    if (child.classList.contains("hero")) setLane(child, "lane-full");
    else if (child.tagName === "HR") setLane(child, "lane-full");
  }

  const sections = Array.from(root.querySelectorAll(".paper-section"));
  for (const section of sections) {
    const h2 = section.querySelector(":scope > h2");
    if (h2) setLane(h2, "lane-narrow");
    const body = section.querySelector(":scope > .section-body");
    if (!body) continue;

    for (const el of Array.from(body.children)) {
      if (el.classList.contains("flow3d") || el.classList.contains("widget-grid") || el.classList.contains("block-grid")) {
        setLane(el, "lane-wide");
        continue;
      }
      if (el.tagName === "TABLE") {
        // Tables usually want the full editorial rhythm (wide lane) so columns don't look cramped.
        setLane(el, "lane-wide");
        continue;
      }
      if (el.tagName === "HR") {
        setLane(el, "lane-full");
        continue;
      }
      if (["H3", "P", "UL", "OL", "PRE"].includes(el.tagName)) {
        setLane(el, "lane-narrow");
        continue;
      }
    }
  }
}

function initReveals() {
  const root = els.content;
  if (!root) return;

  const set = new Set();

  for (const el of root.querySelectorAll(".hero > *")) set.add(el);
  for (const el of root.querySelectorAll(".paper-section > h2")) set.add(el);
  for (const el of root.querySelectorAll(".section-body > h3")) set.add(el);
  for (const el of root.querySelectorAll(".section-body > p, .section-body > ul, .section-body > ol, .section-body > pre, .section-body > table")) set.add(el);
  for (const el of root.querySelectorAll(".flow3d, .widget-grid, .widget, .block-grid, .block")) set.add(el);

  const elsList = Array.from(set);
  for (const el of elsList) el.dataset.reveal = "1";
  state.reveals.els = elsList;

  syncReveals();
}

function syncReveals() {
  const root = els.content;
  if (!root) return;

  const reduced = prefersReducedMotion();
  const animate = state.motion && !reduced;
  document.documentElement.classList.toggle("reveal-ready", animate);

  // Always ensure content is visible when we can't/shouldn't animate.
  if (!animate || !("IntersectionObserver" in window)) {
    state.reveals.io?.disconnect?.();
    state.reveals.io = null;
    for (const el of state.reveals.els) el.classList.add("is-in");
    return;
  }

  // Ensure above-the-fold items never "blink" hidden.
  const vh = window.innerHeight || 900;
  for (const el of state.reveals.els) {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.9) el.classList.add("is-in");
  }

  if (!state.reveals.io) {
    state.reveals.io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (!ent.isIntersecting) continue;
          ent.target.classList.add("is-in");
          state.reveals.io?.unobserve?.(ent.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
  }

  for (const el of state.reveals.els) {
    if (el.classList.contains("is-in")) continue;
    state.reveals.io.observe(el);
  }
}

function wrapSections() {
  // Group content under each H2 so it can be collapsed/expanded.
  const root = els.content;
  const h2s = Array.from(root.querySelectorAll("h2"));
  for (let i = 0; i < h2s.length; i++) {
    const h2 = h2s[i];
    if (h2.nextElementSibling?.classList?.contains("section-body")) continue;

    const body = document.createElement("div");
    body.className = "section-body";

    let node = h2.nextSibling;
    while (node) {
      const next = node.nextSibling;
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "h2") break;
      body.appendChild(node);
      node = next;
    }

    h2.after(body);
  }

  // Wrap each H2 + body pair into a paper section for layout/styling hooks.
  const h2s2 = Array.from(root.querySelectorAll("h2"));
  for (const h2 of h2s2) {
    const body = h2.nextElementSibling;
    if (!body?.classList?.contains("section-body")) continue;
    if (h2.parentElement?.classList?.contains("paper-section")) continue;
    const section = document.createElement("section");
    section.className = "paper-section";
    h2.before(section);
    section.append(h2, body);
  }
}

function applySavedCollapsed() {
  const collapsed = new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]"));
  for (const id of collapsed) {
    const btn = els.content.querySelector(`.collapse-btn[data-collapse="${CSS.escape(id)}"]`);
    if (!btn) continue;
    const h2 = btn.closest("h2");
    const body = h2?.nextElementSibling;
    if (body?.classList?.contains("section-body")) {
      body.classList.add("collapsed");
      btn.textContent = "[+]";
      btn.setAttribute("aria-expanded", "false");
    }
  }
}

function toggleCollapse(id) {
  const btn = els.content.querySelector(`.collapse-btn[data-collapse="${CSS.escape(id)}"]`);
  const h2 = btn?.closest("h2");
  const body = h2?.nextElementSibling;
  if (!btn || !body?.classList?.contains("section-body")) return;

  const isCollapsed = body.classList.toggle("collapsed");
  btn.textContent = isCollapsed ? "[+]" : "[-]";
  btn.setAttribute("aria-expanded", String(!isCollapsed));

  const collapsed = new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]"));
  if (isCollapsed) collapsed.add(id);
  else collapsed.delete(id);
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(Array.from(collapsed)));

  // Charts created while collapsed need a resize once the section becomes visible.
  if (!isCollapsed) {
    requestAnimationFrame(() => {
      for (const canvas of body.querySelectorAll("canvas")) {
        Chart.getChart(canvas)?.resize();
      }
    });
  }
}

function expandForHeading(headingEl) {
  if (!headingEl) return;
  if (headingEl.tagName === "H2") {
    const body = headingEl.nextElementSibling;
    if (body?.classList?.contains("section-body") && body.classList.contains("collapsed")) {
      toggleCollapse(headingEl.id);
    }
    return;
  }
  const body = headingEl.closest?.(".section-body");
  if (!body || !body.classList.contains("collapsed")) return;
  const h2 = body.previousElementSibling;
  if (h2?.tagName === "H2") toggleCollapse(h2.id);
}

function wireCollapsers() {
  els.content.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".collapse-btn");
    if (!btn) return;
    toggleCollapse(btn.dataset.collapse);
  });

  // Clicking the # link copies the URL.
  els.content.addEventListener("click", async (e) => {
    const a = e.target.closest?.(".heading-link");
    if (!a) return;
    e.preventDefault();
    const url = new URL(location.href);
    url.hash = a.getAttribute("href");
    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      // Fallback: update URL only.
    }
    history.replaceState(null, "", url.hash);
  });
}

function updateProgress() {
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
  const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  els.progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function initParallax() {
  const root = document.getElementById("parallax");
  if (!root) return;
  state.parallax.root = root;
  state.parallax.layers = Array.from(root.querySelectorAll("[data-sx]"));
  state.parallax.target.scrollY = window.scrollY || 0;
  state.parallax.cur.scrollY = state.parallax.target.scrollY;

  const onMove = (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    state.parallax.target.x = ((e.clientX / w) - 0.5) * 2;
    state.parallax.target.y = ((e.clientY / h) - 0.5) * 2;
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", () => {
    state.parallax.target.x = 0;
    state.parallax.target.y = 0;
  });
  window.addEventListener(
    "scroll",
    () => {
      state.parallax.target.scrollY = window.scrollY || 0;
    },
    { passive: true }
  );

  syncParallax();
}

function startParallax() {
  const p = state.parallax;
  if (!p.root || p.running || !p.layers.length) return;
  p.running = true;

  const tick = () => {
    if (!p.running) return;

    // Ease toward targets for a soft parallax feel.
    const ease = 0.075;
    p.cur.x += (p.target.x - p.cur.x) * ease;
    p.cur.y += (p.target.y - p.cur.y) * ease;
    p.cur.scrollY += (p.target.scrollY - p.cur.scrollY) * 0.06;

    for (const layer of p.layers) {
      const sx = Number(layer.dataset.sx || 0);
      const sy = Number(layer.dataset.sy || 0);
      const ss = Number(layer.dataset.ss || 0);
      const x = p.cur.x * sx;
      const y = p.cur.y * sy + p.cur.scrollY * ss;
      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }

    p.raf = requestAnimationFrame(tick);
  };

  p.raf = requestAnimationFrame(tick);
}

function stopParallax() {
  const p = state.parallax;
  p.running = false;
  if (p.raf) cancelAnimationFrame(p.raf);
  p.raf = 0;
  for (const layer of p.layers) layer.style.transform = "";
}

function syncParallax() {
  const p = state.parallax;
  if (!p.root) return;
  if (!state.motion) {
    stopParallax();
    p.root.style.opacity = "0";
    return;
  }
  p.root.style.opacity = "";
  startParallax();
}

function registerChart(chart, { restyle, observeEl } = {}) {
  if (!chart) return;

  if (typeof restyle === "function") chart.__evaRestyle = restyle;
  state.charts.add(chart);

  const el = observeEl || chart.canvas?.parentElement;
  if (el && "ResizeObserver" in window) {
    const ro = new ResizeObserver(() => {
      try {
        chart.resize();
      } catch {
        // ignore
      }
    });
    ro.observe(el);
    state.resizeObservers.add(ro);
  }

  restyleCharts();
}

function restyleCharts() {
  Chart.defaults.color = cssVar("--muted") || "#666";
  Chart.defaults.font.family = '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif';
  Chart.defaults.borderColor = cssVar("--faint") || "rgba(0,0,0,0.1)";

  for (const chart of state.charts) {
    if (typeof chart.__evaRestyle === "function") chart.__evaRestyle();
    chart.options.animation = state.motion ? { duration: 420 } : false;
    chart.update(state.motion ? undefined : "none");
  }
}

function restyleFlows() {
  for (const flow of state.flows) {
    try {
      flow?.restyle?.();
    } catch {
      // ignore
    }
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function headingLabel(h) {
  const labelEl = h.querySelector?.(".heading-row > span");
  return (labelEl?.textContent || h.textContent || "").trim();
}

function findHeading(tag, match) {
  const hs = Array.from(els.content.querySelectorAll(tag));
  for (const h of hs) {
    const label = headingLabel(h).toLowerCase();
    if (match(label, h)) return h;
  }
  return null;
}

function findNextTable(afterEl) {
  let n = afterEl?.nextElementSibling;
  while (n) {
    if (n.tagName === "TABLE") return n;
    if (/^H[23]$/.test(n.tagName)) break;
    n = n.nextElementSibling;
  }
  return null;
}

function parseHtmlTable(table) {
  const headers = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent || "").trim());
  const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
    Array.from(tr.querySelectorAll("td, th")).map((td) => (td.textContent || "").trim())
  );
  return { headers, rows };
}

function numFromText(s) {
  const t = String(s || "")
    .replaceAll(",", "")
    .replace(/\s+/g, " ")
    .trim();
  const m = t.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

function fmt(n, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  const f = new Intl.NumberFormat(undefined, { maximumFractionDigits: digits });
  return f.format(n);
}

function wireCodeCopyButtons() {
  for (const pre of els.content.querySelectorAll("pre")) {
    if (pre.dataset.copy === "1") continue;
    pre.dataset.copy = "1";

    const btn = el("button", "copy-btn", "Copy");
    btn.type = "button";
    btn.addEventListener("click", async () => {
      const code = pre.querySelector("code")?.textContent || pre.textContent || "";
      try {
        await navigator.clipboard.writeText(code.trimEnd());
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 900);
      } catch {
        btn.textContent = "Failed";
        setTimeout(() => (btn.textContent = "Copy"), 900);
      }
    });

    pre.appendChild(btn);
  }
}

function transformFlowcharts() {
  const pres = Array.from(els.content.querySelectorAll("pre"));
  for (const pre of pres) {
    const code = pre.querySelector("code");
    if (!code) continue;
    const raw = (code.textContent || "").trim();
    const spec = flowSpecFromCode(raw);
    if (!spec) continue;

    const flow = createFlow3D(spec);
    pre.replaceWith(flow);
  }
}

function wrapTables() {
  const tables = Array.from(els.content.querySelectorAll("table"));
  for (const table of tables) {
    if (table.closest(".table-wrap")) continue;

    const wrap = el("div", "table-wrap");

    // If lanes were already applied directly to the table, move them to the wrapper.
    for (const c of LANE_CLASSES) {
      if (!table.classList.contains(c)) continue;
      wrap.classList.add(c);
      table.classList.remove(c);
    }
    if (!LANE_CLASSES.some((c) => wrap.classList.contains(c))) wrap.classList.add("lane-wide");

    table.before(wrap);
    wrap.append(table);
  }
}

function flowSpecFromCode(raw) {
  if (!raw) return null;

  if (raw.includes("Publishers (Human or AI)")) return FLOW_SPECS.solution;
  if (raw.includes("CONSUMPTION LAYER") && raw.includes("BASE L2")) return FLOW_SPECS.architecture;
  if (raw.includes("CLAIM VERIFICATION") && raw.includes("Article Published")) return FLOW_SPECS.claimVerification;
  if (raw.includes("Users pay $EVA") && raw.includes("Treasury")) return FLOW_SPECS.revenueDistribution;
  if (raw.startsWith("More users") && raw.includes("cycle repeats")) return FLOW_SPECS.valueFlywheel;
  if (raw.includes("Register (ERC-8004)") && raw.includes("Reputation Updates")) return FLOW_SPECS.publisherFlow;

  // Detect generic box-drawing diagrams but skip them unless recognized above.
  if (/[┌┐└┘│─]/.test(raw)) return null;
  return null;
}

const FLOW_SPECS = {
  solution: {
    id: "solution",
    title: "Decentralized Trust Layer",
    hint: "Click nodes to inspect.",
    nodes: [
      {
        id: "publishers",
        label: "Publishers\n(Human or AI)",
        tone: "teal2",
        desc: "Publish articles (stored on IPFS) under an ERC-8004 identity. Humans and agents play by the same rules.",
        x: -260,
        y: -120,
        z: -120,
      },
      {
        id: "validators",
        label: "Validators\n(Staked)",
        tone: "teal",
        desc: "Verify extracted factual claims with evidence. Wrong validations risk slashing.",
        x: 0,
        y: -10,
        z: 120,
      },
      {
        id: "readers",
        label: "Readers",
        tone: "good",
        desc: "Rate quality and accuracy. Weight grows with time, stake, and reputation (Sybil resistant).",
        x: 260,
        y: -120,
        z: -90,
      },
      {
        id: "reputation",
        label: "Reputation",
        tone: "warn",
        desc: "Emerges from collective assessment. Feeds curation and future weighting.",
        x: 0,
        y: 230,
        z: 40,
      },
    ],
    edges: [
      { from: "publishers", to: "validators", label: "claims" },
      { from: "validators", to: "readers", label: "verdicts" },
      { from: "readers", to: "reputation", label: "ratings" },
      { from: "reputation", to: "publishers", label: "weight" },
    ],
  },

  architecture: {
    id: "architecture",
    title: "Protocol Architecture (Layers)",
    hint: "Click a layer to inspect responsibilities.",
    nodes: [
      {
        id: "consumption",
        label: "Consumption\nLayer",
        tone: "teal2",
        desc: "Surfaces content to users via Web, Mobile, API, RSS, and social distribution.",
        x: 0,
        y: -260,
        z: -120,
      },
      {
        id: "curation",
        label: "Curation\nLayer",
        tone: "teal",
        desc: "Personalization, trending, and reputation filters shape what gets attention.",
        x: 0,
        y: -175,
        z: 0,
      },
      {
        id: "validation",
        label: "Validation\nLayer",
        tone: "good",
        desc: "Claim extraction, validator selection, and challenges drive verifiable truth.",
        x: 0,
        y: -90,
        z: 90,
      },
      {
        id: "feedback",
        label: "Feedback\nLayer",
        tone: "warn",
        desc: "Reader ratings update reputation and trigger Sybil detection.",
        x: 0,
        y: -5,
        z: 0,
      },
      {
        id: "publishing",
        label: "Publishing\nLayer",
        tone: "teal2",
        desc: "Article submission, claim tagging, and storage (IPFS) live here.",
        x: 0,
        y: 80,
        z: -70,
      },
      {
        id: "identity",
        label: "Identity\nLayer (ERC-8004)",
        tone: "teal",
        desc: "Publisher registration, credentials, and wallet-based identity/reputation.",
        x: 0,
        y: 170,
        z: 70,
      },
      {
        id: "base",
        label: "Base L2",
        tone: "bad",
        desc: "Fast finality and low fees on an EVM-compatible L2.",
        x: 0,
        y: 260,
        z: 130,
      },
    ],
    edges: [
      { from: "consumption", to: "curation" },
      { from: "curation", to: "validation" },
      { from: "validation", to: "feedback" },
      { from: "feedback", to: "publishing" },
      { from: "publishing", to: "identity" },
      { from: "identity", to: "base" },
    ],
  },

  claimVerification: {
    id: "claimVerification",
    title: "Claim Verification Flow",
    hint: "Click steps to inspect what happens at each stage.",
    nodes: [
      { id: "publish", label: "Article\nPublished", tone: "teal2", desc: "Publisher submits an article, stored and signed.", x: -320, y: -40, z: -90 },
      { id: "extract", label: "AI Extracts\nClaims", tone: "teal", desc: "AI identifies verifiable factual claims.", x: -150, y: 30, z: 60 },
      { id: "tag", label: "Claims\nTagged", tone: "warn", desc: "Claims classified as factual, opinion, or prediction.", x: 10, y: -40, z: 130 },
      { id: "select", label: "Validators\nSelected", tone: "good", desc: "5 validators chosen randomly, weighted by stake.", x: 160, y: 40, z: 30 },
      { id: "verify", label: "Evidence +\nVerdicts", tone: "teal2", desc: "Validators check sources and submit evidence-backed verdicts.", x: 330, y: -10, z: -60 },
      { id: "consensus", label: "Consensus\n(3/5)", tone: "teal", desc: "Consensus determines claim status; disputes remain visible.", x: 500, y: 55, z: 60 },
      { id: "status", label: "Status:\nVerified / Disputed / False", tone: "bad", desc: "Claim states propagate into reputation and curation.", x: 680, y: -20, z: -20 },
    ],
    edges: [
      { from: "publish", to: "extract" },
      { from: "extract", to: "tag" },
      { from: "tag", to: "select", label: "factual only" },
      { from: "select", to: "verify" },
      { from: "verify", to: "consensus" },
      { from: "consensus", to: "status" },
    ],
  },

  revenueDistribution: {
    id: "revenue",
    title: "Revenue Distribution",
    hint: "Click nodes to inspect where EVA flows.",
    nodes: [
      { id: "users", label: "Users", tone: "teal2", desc: "Users pay EVA for subscriptions, unlocks, API calls, and fees.", x: -360, y: -30, z: -110 },
      { id: "treasury", label: "Treasury\n(EVA)", tone: "teal", desc: "Receives protocol revenue and distributes by rules.", x: -120, y: -60, z: 80 },
      { id: "publishers", label: "Publishers\n60%", tone: "good", desc: "Creator rewards for accurate, valued reporting.", x: 120, y: -180, z: -30 },
      { id: "validators", label: "Validators\n25%", tone: "warn", desc: "Paid for verification work; wrong validations risk slashing.", x: 240, y: -10, z: 40 },
      { id: "pool", label: "Burn/Stake\n15%", tone: "bad", desc: "Half burned (deflation), half distributed to stakers.", x: 120, y: 160, z: 120 },
      { id: "burn", label: "Burn\n7.5%", tone: "bad", desc: "Permanent burn reduces supply over time.", x: 320, y: 210, z: -40 },
      { id: "stakers", label: "Stakers\n7.5%", tone: "teal2", desc: "Stakers earn a share of protocol revenue.", x: -40, y: 240, z: -60 },
    ],
    edges: [
      { from: "users", to: "treasury" },
      { from: "treasury", to: "publishers" },
      { from: "treasury", to: "validators" },
      { from: "treasury", to: "pool" },
      { from: "pool", to: "burn" },
      { from: "pool", to: "stakers" },
    ],
  },

  valueFlywheel: {
    id: "flywheel",
    title: "Value Accrual Flywheel",
    hint: "Click a step to inspect the claim.",
    nodes: (() => {
      const steps = [
        { id: "users", label: "More users", tone: "teal2", desc: "Growth brings more paying participants to the ecosystem." },
        { id: "demand", label: "More EVA demand", tone: "teal", desc: "Platform utility requires EVA, creating buy pressure." },
        { id: "burns", label: "More burns", tone: "bad", desc: "A slice of revenue is burned, reducing supply." },
        { id: "supply", label: "Supply shrinks", tone: "warn", desc: "Supply contraction supports price if demand holds." },
        { id: "price", label: "Price increases", tone: "good", desc: "Higher value increases incentive to stake and participate." },
        { id: "staking", label: "More staking", tone: "teal2", desc: "Staking improves rewards and commitment." },
        { id: "security", label: "Better security", tone: "teal", desc: "More value at stake raises the cost of attacks." },
        { id: "trust", label: "More trust", tone: "good", desc: "Higher verification quality improves user trust." },
        { id: "publishers", label: "More publishers", tone: "warn", desc: "Better rewards attract more publishers, improving supply of content." },
      ];

      const r = 310;
      return steps.map((s, i) => {
        const a = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...s,
          x: Math.cos(a) * r,
          y: Math.sin(a) * r,
          z: Math.sin(a * 2) * 80,
        };
      });
    })(),
    edges: [
      { from: "users", to: "demand" },
      { from: "demand", to: "burns" },
      { from: "burns", to: "supply" },
      { from: "supply", to: "price" },
      { from: "price", to: "staking" },
      { from: "staking", to: "security" },
      { from: "security", to: "trust" },
      { from: "trust", to: "publishers" },
      { from: "publishers", to: "users" },
    ],
  },

  publisherFlow: {
    id: "publisherFlow",
    title: "Publisher Participation Flow",
    hint: "Click steps to inspect roles and incentives.",
    nodes: [
      { id: "register", label: "Register\n(ERC-8004)", tone: "teal2", desc: "Create an agent identity with services and metadata.", x: -280, y: 0, z: -80 },
      { id: "publish", label: "Publish", tone: "teal", desc: "Submit articles and claims for validation.", x: -80, y: -40, z: 90 },
      { id: "rate", label: "Crowd Rates", tone: "good", desc: "Readers and validators provide feedback and verdicts.", x: 120, y: 40, z: 30 },
      { id: "rep", label: "Reputation\nUpdates", tone: "warn", desc: "Outcomes update public reputation and future weight.", x: 320, y: 0, z: -40 },
    ],
    edges: [
      { from: "register", to: "publish" },
      { from: "publish", to: "rate" },
      { from: "rate", to: "rep" },
    ],
  },
};

function createFlow3D(spec) {
  const wrap = el("section", "flow3d");
  wrap.dataset.flow = spec.id;

  const head = el("div", "flow3d-head");
  const headText = el("div", "flow3d-headtext");
  headText.append(
    el("div", "flow3d-title", spec.title),
    el("div", "flow3d-hint", spec.hint || "Click a node to inspect.")
  );
  head.append(headText);

  const stage = el("div", "flow-stage");
  const { svg, nodes, edges, byId } = buildFlowSvg(spec);
  stage.append(svg);

  const info = el("div", "flow3d-inspector");
  info.innerHTML = `<div class="flow3d-inspector-title">Inspect a node</div><div class="flow3d-inspector-body">Click any node to see details.</div>`;

  wrap.append(head, stage, info);

  let selectedId = null;

  function updateInspector() {
    const node = spec.nodes.find((n) => n.id === selectedId);
    if (!node) {
      info.innerHTML = `<div class="flow3d-inspector-title">Inspect a node</div><div class="flow3d-inspector-body">Click any node to see details.</div>`;
      return;
    }

    const links = [];
    for (const e of spec.edges) {
      if (e.from === node.id) links.push(`→ ${labelFor(spec, e.to)}`);
      if (e.to === node.id) links.push(`← ${labelFor(spec, e.from)}`);
    }

    const title = escapeHtml(String(node.label || "").replaceAll("\n", " "));
    const body = escapeHtml(String(node.desc || ""));
    const conn = links.length ? `<div class="flow3d-inspector-links">${links.map((x) => `<span>${escapeHtml(x)}</span>`).join("")}</div>` : "";
    info.innerHTML = `<div class="flow3d-inspector-title">${title}</div><div class="flow3d-inspector-body">${body}</div>${conn}`;
  }

  function restyle() {
    const ink = cssVar("--ink") || "#000";
    const muted = cssVar("--muted") || "rgba(0,0,0,0.7)";
    const faint = cssVar("--faint") || "rgba(0,0,0,0.12)";

    svg.style.color = muted;

    for (const n of nodes) {
      const g = n.el;
      const rect = n.rect;
      const text = n.text;
      const tone = flowTone(n.node.tone);

      const active = n.node.id === selectedId;
      const fillA = state.theme === "dark" ? (active ? 0.22 : 0.16) : active ? 0.30 : 0.22;
      const strokeA = state.theme === "dark" ? (active ? 0.95 : 0.55) : active ? 0.95 : 0.70;

      rect.setAttribute("fill", rgba(tone, fillA));
      rect.setAttribute("stroke", active ? rgba(tone, strokeA) : faint);
      rect.setAttribute("stroke-width", active ? "2.4" : "1.2");
      g.classList.toggle("is-selected", active);

      text.setAttribute("fill", ink);
    }

    for (const e of edges) {
      const active = !!selectedId && (e.fromId === selectedId || e.toId === selectedId);
      e.path.classList.toggle("is-active", active);
    }
  }

  function setSelected(next) {
    selectedId = next;
    updateInspector();
    restyle();
  }

  svg.addEventListener("click", (e) => {
    const g = e.target?.closest?.("[data-node]");
    if (!g) {
      setSelected(null);
      return;
    }
    const id = g.getAttribute("data-node");
    setSelected(id || null);
  });

  // Initial style pass (includes theme colors).
  restyle();

  const api = { wrap, svg, restyle };
  state.flows.add(api);
  wrap.__evaFlow = api;

  return wrap;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = null) {
  const node = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      node.setAttribute(k, String(v));
    }
  }
  return node;
}

function flowTone(tone) {
  const map = {
    teal: cssVar("--teal") || "#85cbda",
    teal2: cssVar("--teal2") || "#8ad8c0",
    good: cssVar("--good") || "#c6f459",
    warn: cssVar("--warn") || "#9cb7eb",
    bad: cssVar("--bad") || "#f39a8e",
  };
  return map[tone] || map.teal;
}

function labelFor(spec, id) {
  const n = spec.nodes.find((x) => x.id === id);
  return n ? String(n.label || "").replaceAll("\n", " ") : id;
}

function rectEdgePoint(cx, cy, hw, hh, tx, ty) {
  const dx = tx - cx;
  const dy = ty - cy;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx < 1e-6 && ady < 1e-6) return { x: cx, y: cy };
  const sx = hw / Math.max(1e-6, adx);
  const sy = hh / Math.max(1e-6, ady);
  const t = Math.min(sx, sy);
  return { x: cx + dx * t, y: cy + dy * t };
}

function buildFlowSvg(spec) {
  const svg = svgEl("svg", {
    class: "flow-svg",
    role: "img",
    "aria-label": spec.title || "Flow diagram",
    viewBox: "0 0 1000 600",
    preserveAspectRatio: "xMidYMid meet",
  });

  const defs = svgEl("defs");
  const marker = svgEl("marker", {
    id: `arrow-${spec.id}`,
    markerWidth: "12",
    markerHeight: "12",
    refX: "10",
    refY: "6",
    orient: "auto",
    markerUnits: "strokeWidth",
  });
  marker.append(svgEl("path", { d: "M0,0 L12,6 L0,12 Z", fill: "currentColor" }));
  defs.append(marker);
  svg.append(defs);

  const gEdges = svgEl("g", { class: "flow-edges" });
  const gNodes = svgEl("g", { class: "flow-nodes" });
  svg.append(gEdges, gNodes);

  const nodes = spec.nodes.map((node) => {
    const lines = String(node.label || "").split("\n");
    const maxLen = Math.max(0, ...lines.map((l) => l.length));
    const w = clamp(150, 72 + maxLen * 8.3, 340);
    const h = 56 + lines.length * 18;
    return { node, id: node.id, x: Number(node.x) || 0, y: Number(node.y) || 0, w, h, lines, el: null, rect: null, text: null };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.w / 2);
    maxX = Math.max(maxX, n.x + n.w / 2);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 1000;
    maxY = 600;
  }
  const pad = 80;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = (maxX - minX) + pad * 2;
  const vbH = (maxY - minY) + pad * 2;
  svg.setAttribute("viewBox", `${vbX} ${vbY} ${Math.max(1, vbW)} ${Math.max(1, vbH)}`);

  const edges = [];
  for (const e of spec.edges || []) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;

    const s = rectEdgePoint(a.x, a.y, a.w / 2, a.h / 2, b.x, b.y);
    const t = rectEdgePoint(b.x, b.y, b.w / 2, b.h / 2, a.x, a.y);
    const path = svgEl("path", {
      class: "flow-edge",
      d: `M ${s.x} ${s.y} L ${t.x} ${t.y}`,
      "marker-end": `url(#arrow-${spec.id})`,
      "data-from": e.from,
      "data-to": e.to,
    });
    gEdges.append(path);
    edges.push({ fromId: e.from, toId: e.to, path });

    if (e.label) {
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const lab = svgEl("text", { class: "flow-edge-label", x: mx, y: my - 6, "text-anchor": "middle" });
      lab.textContent = String(e.label);
      gEdges.append(lab);
    }
  }

  for (const n of nodes) {
    const g = svgEl("g", { class: "flow-node", "data-node": n.id, "data-tone": n.node.tone || "" });
    const rect = svgEl("rect", {
      x: n.x - n.w / 2,
      y: n.y - n.h / 2,
      width: n.w,
      height: n.h,
      rx: "18",
      ry: "18",
    });

    const text = svgEl("text", {
      class: "flow-node-label",
      "text-anchor": "middle",
      x: n.x,
    });
    const fontSize = 14;
    const lineH = fontSize + 4;
    const startY = n.y - ((n.lines.length - 1) * lineH) / 2;
    for (let i = 0; i < n.lines.length; i++) {
      const tspan = svgEl("tspan", { x: n.x, y: startY + i * lineH });
      tspan.textContent = n.lines[i];
      text.append(tspan);
    }

    g.append(rect, text);
    gNodes.append(g);
    n.el = g;
    n.rect = rect;
    n.text = text;
  }

  return { svg, nodes, edges, byId };
}

function hexToRgb(hex) {
  const h = String(hex || "").trim();
  if (!h.startsWith("#")) return null;
  const x = h.slice(1);
  if (x.length === 3) {
    const r = parseInt(x[0] + x[0], 16);
    const g = parseInt(x[1] + x[1], 16);
    const b = parseInt(x[2] + x[2], 16);
    return { r, g, b };
  }
  if (x.length === 6) {
    const r = parseInt(x.slice(0, 2), 16);
    const g = parseInt(x.slice(2, 4), 16);
    const b = parseInt(x.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function rgba(hex, a) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function injectWidgets() {
  injectSybilWidgets();
  injectEconomicsWidgets();
  injectGovernanceWidgets();
  injectRoadmapWidgets();
}

function injectSybilWidgets() {
  const anchor = findHeading("h3", (t) => t.startsWith("layer 1: economic cost"));
  if (!anchor) return;

  const grid = el("div", "widget-grid");

  // Feedback weight calculator.
  const w1 = el("section", "widget");
  const t1 = el("h4", "widget-title", "Feedback Weight Calculator");
  const s1 = el("p", "widget-sub", "Explore the stake-weighted feedback formula described in Layer 1.");
  const f1 = el("div", "widget-formula");
  katex.render("w = \\sqrt{s}\\,\\times\\,r", f1, { displayMode: true, throwOnError: false });
  const controls1 = el("div", "controls");

  const stake = makeSlider({
    label: "Staked EVA (s)",
    min: 0,
    max: 5000,
    step: 1,
    value: 200,
    format: (v) => nf0.format(v),
  });
  const rep = makeSlider({
    label: "Reputation multiplier (r)",
    min: 0.05,
    max: 2.0,
    step: 0.01,
    value: 1.0,
    format: (v) => fmt(v, 2) + "x",
    digits: 2,
  });

  const out = el("div", "row");
  const chip = el("div", "chip");
  chip.innerHTML = `weight <strong id="fw_out">—</strong>`;
  out.appendChild(chip);

  controls1.append(stake.root, rep.root, out);

  w1.append(t1, s1, f1, controls1);

  function recompute1() {
    const s = stake.get();
    const r = rep.get();
    const w = Math.sqrt(Math.max(0, s)) * r;
    w1.querySelector("#fw_out").textContent = fmt(w, 3);
  }
  stake.onChange(recompute1);
  rep.onChange(recompute1);
  recompute1();

  // Sybil comparator.
  const w2 = el("section", "widget");
  const t2 = el("h4", "widget-title", "Sybil Comparator");
  const s2 = el(
    "p",
    "widget-sub",
    "Compare influence from many small accounts vs one larger account (including a reputation multiplier)."
  );
  const f2 = el("div", "widget-formula");
  katex.render("W_{many}=N\\,\\sqrt{s_a}\\,r_a\\quad\\; W_{one}=\\sqrt{s_o}\\,r_o", f2, {
    displayMode: true,
    throwOnError: false,
  });
  const controls2 = el("div", "controls");

  const nAcc = makeSlider({ label: "Accounts (N)", min: 1, max: 300, step: 1, value: 100, format: (v) => nf0.format(v) });
  const sEach = makeSlider({
    label: "Stake per account (s_a)",
    min: 0,
    max: 200,
    step: 1,
    value: 2,
    format: (v) => nf0.format(v),
  });
  const rEach = makeSlider({
    label: "Rep multiplier per account (r_a)",
    min: 0.05,
    max: 1.0,
    step: 0.01,
    value: 0.1,
    format: (v) => fmt(v, 2) + "x",
    digits: 2,
  });
  const sOne = makeSlider({
    label: "Single-account stake (s_o)",
    min: 0,
    max: 2000,
    step: 1,
    value: 200,
    format: (v) => nf0.format(v),
  });
  const rOne = makeSlider({
    label: "Single-account rep (r_o)",
    min: 0.05,
    max: 2.0,
    step: 0.01,
    value: 1.0,
    format: (v) => fmt(v, 2) + "x",
    digits: 2,
  });

  const chartWrap = el("div", "chart-wrap");
  chartWrap.style.height = "190px";
  const canvas = el("canvas");
  chartWrap.appendChild(canvas);

  const metaRow = el("div", "row");
  const aChip = el("div", "chip");
  aChip.innerHTML = `many <strong id="many_out">—</strong>`;
  const oChip = el("div", "chip");
  oChip.innerHTML = `one <strong id="one_out">—</strong>`;
  const rChip = el("div", "chip");
  rChip.innerHTML = `ratio <strong id="ratio_out">—</strong>`;
  metaRow.append(aChip, oChip, rChip);

  controls2.append(nAcc.root, sEach.root, rEach.root, sOne.root, rOne.root, chartWrap, metaRow);
  w2.append(t2, s2, f2, controls2);

  const bar = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Many accounts", "Single account"],
      datasets: [
        {
          label: "Weight",
          data: [0, 0],
          borderWidth: 1,
          borderRadius: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    },
  });

  registerChart(bar, {
    observeEl: chartWrap,
    restyle() {
      const muted = cssVar("--muted");
      const faint = cssVar("--faint");
      const teal = cssVar("--teal");
      const teal2 = cssVar("--teal2");
      bar.data.datasets[0].backgroundColor = [teal2, teal];
      bar.data.datasets[0].borderColor = faint;
      bar.options.scales.x.ticks.color = muted;
      bar.options.scales.y.ticks.color = muted;
      bar.options.scales.y.grid.color = faint;
    },
  });

  function recompute2() {
    const many = nAcc.get() * Math.sqrt(Math.max(0, sEach.get())) * rEach.get();
    const one = Math.sqrt(Math.max(0, sOne.get())) * rOne.get();
    const ratio = one > 0 ? many / one : Infinity;

    w2.querySelector("#many_out").textContent = fmt(many, 3);
    w2.querySelector("#one_out").textContent = fmt(one, 3);
    w2.querySelector("#ratio_out").textContent = Number.isFinite(ratio) ? fmt(ratio, 2) + "x" : "—";

    bar.data.datasets[0].data = [many, one];
    bar.update(state.motion ? undefined : "none");
  }

  for (const c of [nAcc, sEach, rEach, sOne, rOne]) c.onChange(recompute2);
  recompute2();

  grid.append(w1, w2);
  anchor.after(grid);
}

function injectEconomicsWidgets() {
  const revenue = findHeading("h3", (t) => t === "revenue distribution");
  if (revenue) {
    const grid = el("div", "widget-grid");
    const w = el("section", "widget");
    w.append(
      el("h4", "widget-title", "Revenue Split Simulator"),
      el("p", "widget-sub", "Drag total platform revenue to see the protocol split and deflationary burn.")
    );

    const f = el("div", "widget-formula");
    katex.render("\\text{Publishers }60\\%\\;\\;\\text{Validators }25\\%\\;\\;\\text{Burn }7.5\\%\\;\\;\\text{Stakers }7.5\\%", f, {
      displayMode: true,
      throwOnError: false,
    });

    const controls = el("div", "controls");
    const total = makeSlider({
      label: "Total revenue (EVA)",
      min: 0,
      max: 200000,
      step: 100,
      value: 50000,
      format: (v) => nf0.format(v),
    });

    const chartWrap = el("div", "chart-wrap");
    const canvas = el("canvas");
    chartWrap.appendChild(canvas);

    const chips = el("div", "row");
    const cPub = el("div", "chip");
    cPub.innerHTML = `publishers <strong id="rev_pub">—</strong>`;
    const cVal = el("div", "chip");
    cVal.innerHTML = `validators <strong id="rev_val">—</strong>`;
    const cBurn = el("div", "chip");
    cBurn.innerHTML = `burn <strong id="rev_burn">—</strong>`;
    const cStake = el("div", "chip");
    cStake.innerHTML = `stakers <strong id="rev_stake">—</strong>`;
    chips.append(cPub, cVal, cBurn, cStake);

    controls.append(total.root, chartWrap, chips, el("div", "note", "Assumes the paper's 15% Burn/Stake pool split 50/50."));
    w.append(f, controls);
    grid.append(w);
    revenue.after(grid);

    const doughnut = new Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Publishers", "Validators", "Burn", "Stakers"],
        datasets: [{ data: [0, 0, 0, 0], borderWidth: 1 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: { legend: { position: "bottom" } },
      },
    });

    registerChart(doughnut, {
      observeEl: chartWrap,
      restyle() {
        const faint = cssVar("--faint");
        const muted = cssVar("--muted");
        const teal = cssVar("--teal");
        const teal2 = cssVar("--teal2");
        const warn = cssVar("--warn");
        const good = cssVar("--good");

        doughnut.data.datasets[0].backgroundColor = [teal2, teal, warn, good];
        doughnut.data.datasets[0].borderColor = faint;
        doughnut.options.plugins.legend.labels.color = muted;
      },
    });

    function recompute() {
      const t = total.get();
      const pub = t * 0.6;
      const val = t * 0.25;
      const burn = t * 0.075;
      const stake = t * 0.075;

      w.querySelector("#rev_pub").textContent = nf0.format(pub);
      w.querySelector("#rev_val").textContent = nf0.format(val);
      w.querySelector("#rev_burn").textContent = nf0.format(burn);
      w.querySelector("#rev_stake").textContent = nf0.format(stake);

      doughnut.data.datasets[0].data = [pub, val, burn, stake];
      doughnut.update(state.motion ? undefined : "none");
    }
    total.onChange(recompute);
    recompute();
  }

  const lockAnchor = findHeading("h3", (t) => t === "lock duration multipliers");
  if (lockAnchor) {
    const grid = el("div", "widget-grid");
    const w = el("section", "widget");
    w.append(
      el("h4", "widget-title", "Lock Multiplier Explorer"),
      el("p", "widget-sub", "Use the table's multipliers to see how lock duration scales staking power.")
    );

    const tbl = findNextTable(lockAnchor);
    let points = [
      { days: 30, mult: 1.0 },
      { days: 90, mult: 1.25 },
      { days: 180, mult: 1.5 },
      { days: 365, mult: 2.0 },
    ];
    if (tbl) {
      const parsed = parseHtmlTable(tbl);
      const next = [];
      for (const r of parsed.rows) {
        const d = String(r[0] || "").match(/(\d+)\s*days?/i);
        const m = String(r[1] || "").match(/(\d+(\.\d+)?)/);
        if (!d || !m) continue;
        next.push({ days: Number(d[1]), mult: Number(m[1]) });
      }
      if (next.length) points = next;
    }

    const stake = makeSlider({
      label: "Stake (EVA)",
      min: 0,
      max: 5000,
      step: 10,
      value: 500,
      format: (v) => nf0.format(v),
    });

    const chartWrap = el("div", "chart-wrap");
    const canvas = el("canvas");
    chartWrap.appendChild(canvas);

    const out = el("div", "row");
    const chip = el("div", "chip");
    chip.innerHTML = `power at max lock <strong id="lock_out">—</strong>`;
    out.appendChild(chip);

    const controls = el("div", "controls");
    controls.append(stake.root, chartWrap, out);
    w.append(controls);
    grid.append(w);
    lockAnchor.after(grid);

    const chart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: points.map((p) => `${p.days}d`),
        datasets: [{ label: "Staking power", data: points.map(() => 0), borderRadius: 12, borderWidth: 1 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
      },
    });

    registerChart(chart, {
      observeEl: chartWrap,
      restyle() {
        const faint = cssVar("--faint");
        const muted = cssVar("--muted");
        const teal = cssVar("--teal");
        chart.data.datasets[0].backgroundColor = teal;
        chart.data.datasets[0].borderColor = faint;
        chart.options.scales.x.ticks.color = muted;
        chart.options.scales.y.ticks.color = muted;
        chart.options.scales.y.grid.color = faint;
      },
    });

    function recompute() {
      const s = stake.get();
      const vals = points.map((p) => s * p.mult);
      chart.data.datasets[0].data = vals;
      chart.update(state.motion ? undefined : "none");
      const max = Math.max(...vals);
      w.querySelector("#lock_out").textContent = nf0.format(max);
    }
    stake.onChange(recompute);
    recompute();
  }
}

function injectGovernanceWidgets() {
  const anchor = findHeading("h3", (t) => t === "voting power");
  if (!anchor) return;

  // Reuse multiplier table if present.
  const lockAnchor = findHeading("h3", (t) => t === "lock duration multipliers");
  const tbl = lockAnchor ? findNextTable(lockAnchor) : null;
  let points = [
    { days: 30, mult: 1.0 },
    { days: 90, mult: 1.25 },
    { days: 180, mult: 1.5 },
    { days: 365, mult: 2.0 },
  ];
  if (tbl) {
    const parsed = parseHtmlTable(tbl);
    const next = [];
    for (const r of parsed.rows) {
      const d = String(r[0] || "").match(/(\d+)\s*days?/i);
      const m = String(r[1] || "").match(/(\d+(\.\d+)?)/);
      if (!d || !m) continue;
      next.push({ days: Number(d[1]), mult: Number(m[1]) });
    }
    if (next.length) points = next;
  }

  const grid = el("div", "widget-grid");
  const w = el("section", "widget");
  w.append(el("h4", "widget-title", "Governance Voting Power"), el("p", "widget-sub", "Interactive version of the paper's voting power formula."));

  const f = el("div", "widget-formula");
  katex.render("v = s\\,\\times\\,m\\,\\times\\,r", f, { displayMode: true, throwOnError: false });

  const stake = makeSlider({ label: "Staked EVA (s)", min: 0, max: 10000, step: 10, value: 2000, format: (v) => nf0.format(v) });
  const rep = makeSlider({
    label: "Reputation multiplier (r)",
    min: 0.05,
    max: 2.0,
    step: 0.01,
    value: 1.0,
    format: (v) => fmt(v, 2) + "x",
    digits: 2,
  });

  const duration = el("div", "control");
  const dHead = el("div", "control-head");
  dHead.append(el("div", null, "Lock duration (m)"));
  const dVal = el("div", "control-val", "");
  dHead.append(dVal);
  const row = el("div", "row");
  const select = el("select", "num");
  for (const p of points) {
    const opt = el("option");
    opt.value = String(p.days);
    opt.textContent = `${p.days} days (${p.mult}x)`;
    select.appendChild(opt);
  }
  const last = points[points.length - 1];
  select.value = String((last && last.days) || points[0].days);
  row.append(select);
  duration.append(dHead, row);

  const chartWrap = el("div", "chart-wrap");
  const canvas = el("canvas");
  chartWrap.appendChild(canvas);

  const out = el("div", "row");
  const chip = el("div", "chip");
  chip.innerHTML = `voting power <strong id="gov_out">—</strong>`;
  out.appendChild(chip);

  const controls = el("div", "controls");
  controls.append(stake.root, rep.root, duration, chartWrap, out);
  w.append(f, controls);
  grid.append(w);
  anchor.after(grid);

  const chart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: points.map((p) => `${p.days}d`),
      datasets: [{ label: "Voting power", data: points.map(() => 0), borderRadius: 12, borderWidth: 1 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    },
  });

  registerChart(chart, {
    observeEl: chartWrap,
    restyle() {
      const faint = cssVar("--faint");
      const muted = cssVar("--muted");
      const teal = cssVar("--teal");
      const teal2 = cssVar("--teal2");
      const selectedDays = Number(select.value);
      chart.data.datasets[0].backgroundColor = points.map((p) => (p.days === selectedDays ? teal2 : teal));
      chart.data.datasets[0].borderColor = faint;
      chart.options.scales.x.ticks.color = muted;
      chart.options.scales.y.ticks.color = muted;
      chart.options.scales.y.grid.color = faint;
      chart.options.plugins.legend.labels.color = muted;
    },
  });

  function recompute() {
    const s = stake.get();
    const r = rep.get();
    const selectedDays = Number(select.value);
    const m = points.find((p) => p.days === selectedDays)?.mult ?? points[0].mult;
    dVal.textContent = `${m}x`;

    const vals = points.map((p) => s * p.mult * r);
    chart.data.datasets[0].data = vals;
    chart.data.datasets[0].backgroundColor = points.map((p) => (p.days === selectedDays ? cssVar("--teal2") : cssVar("--teal")));
    chart.update(state.motion ? undefined : "none");

    w.querySelector("#gov_out").textContent = nf.format(s * m * r);
    restyleCharts();
  }

  stake.onChange(recompute);
  rep.onChange(recompute);
  select.addEventListener("change", recompute);
  recompute();
}

function injectRoadmapWidgets() {
  const h2 = findHeading("h2", (t) => t.startsWith("10. roadmap"));
  if (h2) {
    const body = h2.nextElementSibling;
    if (body?.classList?.contains("section-body")) {
      const phases = Array.from(body.querySelectorAll("h3"))
        .map((h) => ({ h, label: headingLabel(h) }))
        .filter((x) => /^phase\s+\d+:/i.test(x.label));

      if (phases.length) {
        const grid = el("div", "widget-grid");
        const w = el("section", "widget");
        w.append(el("h4", "widget-title", "Roadmap Timeline"), el("p", "widget-sub", "Jump between phases."));

        const strip = el("div", "timeline");
        for (const { h, label } of phases) {
          const btn = el("button", "phase-btn");
          btn.type = "button";
          btn.textContent = label;
          btn.addEventListener("click", () => {
            expandForHeading(h);
            h.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", `#${h.id}`);
          });
          strip.appendChild(btn);
        }

        w.append(strip);
        grid.append(w);
        body.prepend(grid);
      }
    }
  }

  const anchor = findHeading("h3", (t) => t === "success metrics");
  if (!anchor) return;
  const tbl = findNextTable(anchor);
  if (!tbl) return;

  const parsed = parseHtmlTable(tbl);
  const rows = parsed.rows
    .map((r) => ({
      metric: r[0],
      m6: r[1],
      m12: r[2],
    }))
    .filter((r) => r.metric && r.m6 && r.m12);

  if (!rows.length) return;

  const grid = el("div", "widget-grid");
  const w = el("section", "widget");
  w.append(el("h4", "widget-title", "Success Metrics Chart"), el("p", "widget-sub", "Pick a metric to compare Month 6 vs Month 12."));

  const selector = el("div", "control");
  const head = el("div", "control-head");
  head.append(el("div", null, "Metric"));
  const headVal = el("div", "control-val", "");
  head.append(headVal);
  const row = el("div", "row");
  const select = el("select", "num");
  for (const r of rows) {
    const opt = el("option");
    opt.value = r.metric;
    opt.textContent = r.metric;
    select.appendChild(opt);
  }
  row.append(select);
  selector.append(head, row);

  const chartWrap = el("div", "chart-wrap");
  const canvas = el("canvas");
  chartWrap.appendChild(canvas);

  const out = el("div", "row");
  const chip = el("div", "chip");
  chip.innerHTML = `growth <strong id="sm_growth">—</strong>`;
  out.appendChild(chip);

  const controls = el("div", "controls");
  controls.append(selector, chartWrap, out);
  w.append(controls);
  grid.append(w);
  anchor.after(grid);

  const chart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Month 6", "Month 12"],
      datasets: [{ label: "Value", data: [0, 0], borderRadius: 12, borderWidth: 1 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
    },
  });

  registerChart(chart, {
    observeEl: chartWrap,
    restyle() {
      const faint = cssVar("--faint");
      const muted = cssVar("--muted");
      const teal = cssVar("--teal");
      const teal2 = cssVar("--teal2");
      chart.data.datasets[0].backgroundColor = [teal, teal2];
      chart.data.datasets[0].borderColor = faint;
      chart.options.scales.x.ticks.color = muted;
      chart.options.scales.y.ticks.color = muted;
      chart.options.scales.y.grid.color = faint;
    },
  });

  function setMetric(metric) {
    const r = rows.find((x) => x.metric === metric) || rows[0];
    const a = numFromText(r.m6);
    const b = numFromText(r.m12);
    const isPct = String(r.m6).includes("%") || String(r.m12).includes("%");

    headVal.textContent = isPct ? "%" : "";
    chart.data.datasets[0].data = [a, b];
    chart.options.scales.y.suggestedMax = isPct ? 100 : undefined;
    chart.update(state.motion ? undefined : "none");

    const growth = a > 0 ? b / a : Infinity;
    w.querySelector("#sm_growth").textContent = Number.isFinite(growth) ? fmt(growth, 2) + "x" : "—";
  }

  select.addEventListener("change", () => setMetric(select.value));
  setMetric(select.value);
}

function makeSlider({ label, min, max, step, value, format, digits = 0 }) {
  const minN = Number(min);
  const maxN = Number(max);
  const root = el("div", "control");
  const head = el("div", "control-head");
  head.append(el("div", null, label));
  const valEl = el("div", "control-val", "");
  head.append(valEl);

  const row = el("div", "row");
  const range = el("input");
  range.type = "range";
  range.min = String(min);
  range.max = String(max);
  range.step = String(step);
  const num = el("input", "num");
  num.type = "number";
  num.min = String(min);
  num.max = String(max);
  num.step = String(step);
  row.append(range, num);

  root.append(head, row);

  const on = new Set();

  function set(v, from = null) {
    const n = typeof v === "number" ? v : Number(v);
    const raw = Number.isFinite(n) ? n : value;
    const next = Number.isFinite(minN) && Number.isFinite(maxN) ? Math.min(maxN, Math.max(minN, raw)) : raw;
    range.value = String(next);
    num.value = String(next.toFixed(digits));
    valEl.textContent = format ? format(next) : String(next);
    if (from !== "silent") for (const fn of on) fn(next);
  }

  range.addEventListener("input", () => set(Number(range.value)));
  num.addEventListener("input", () => set(Number(num.value)));

  set(value, "silent");

  return {
    root,
    get: () => Number(range.value),
    set: (v) => set(v),
    onChange: (fn) => on.add(fn),
  };
}

function boot() {
  initTheme();
  initMotion();
  initParallax();

  const html = renderMarkdown(normalizeMd(whitepaperMd));
  els.content.innerHTML = html;

  buildHeroFromIntro();
  wrapSections();
  wireCollapsers();
  applySavedCollapsed();
  transformFlowcharts();
  transformKeyListsToBlocks();
  injectWidgets();
  wireCodeCopyButtons();
  wrapTables();
  applyEditorialLanes();
  initReveals();

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  // If loaded with a hash, make sure we scroll after layout settles.
  if (location.hash) {
    const id = location.hash.slice(1);
    setTimeout(() => {
      const el = document.getElementById(id);
      expandForHeading(el);
      el?.scrollIntoView({ block: "start" });
    }, 50);
  }
}

boot();
