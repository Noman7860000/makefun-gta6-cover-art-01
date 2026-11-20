# Vice Nights — GTA-style Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Noman7860000/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Noman7860000/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Nights** turns a photo and a caption into cover art in the style of a
GTA 6 poster — a multi-panel layout, bold outlined lettering and a Vice City
sunset or neon colour grade — and exports it as a PNG to share. It runs
entirely offline in a desktop browser from its own static files; photos never
leave the machine.

## What it does

- **Two photos, three panels** — a hero photo fills the big panel, a second
  photo fills the side panels, with a third crop of the hero below it.
- **Three layouts** — Hero + 2 panels, Hero + 1 panel, or a single full-bleed
  hero.
- **Crop any photo** — click a panel to select it, then drag it, scroll to
  zoom, or use the zoom / move sliders. Each panel keeps its own crop.
- **Four colour grades** — Sunset, Neon, Golden and Noir, each a filter plus a
  tinted gradient and vignette.
- **Bold caption** — editable text in heavy capitals with a black outline,
  drop shadow and a gradient accent rule, in white, yellow, pink or cyan.
- **Three export sizes** — Square 1080 × 1080, Portrait 1080 × 1350 and Wide
  1920 × 1080, exported as a PNG in one click.
- **Sample photos included** — the app opens with a finished-looking cover,
  so it is one caption away from an export.

Everything is original artwork drawn in code — no Rockstar logo, no copied
game art.

## Run it

Serve `app/` locally and open it in a desktop browser:

```sh
node serve.ts
# then open http://localhost:8080
```

Hand the entry in (copies `app/` and `screenshots/` to the output directory
and writes `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html`, `app/style.css` — the page and its sunset theme.
- `app/src/cover.js` — the renderer: panel layouts, grades, caption.
- `app/src/main.js` — state, controls, drag / zoom, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover`,
  `?shot=editor`, `?shot=panels`, `?shot=export`).
- `app/samples/` — the two sample photos (made for make.fun, free to use).
- `main.ts` — the hand-in program (Node 22, standard library only).
- `serve.ts` — a tiny static server for local use.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9y40b2n3&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
