# Eva Whitepaper (Interactive)

Interactive single-page web version of `WHITEPAPER.md` with:
- sidebar table of contents + active section highlight
- collapsible H2 sections (persisted in `localStorage`)
- light/dark theme toggle (persisted)
- motion toggle + parallax background
- interactive formula widgets (KaTeX) + charts (Chart.js)
- inspectable 3D flow diagrams (drag to orbit, click nodes)
- copy-to-clipboard buttons on code blocks
- reading progress bar

## Run

```bash
npm install
npm run dev
```

## Build (static)

```bash
npm run build
npm run preview
```

The static site output is in `dist/`.
