// Wires the page: photos, layout, grade, caption and export size, all drawn live on one
// canvas. A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutSlots, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelHint = document.getElementById('panel-hint');

function defaultPanels(layout) {
  const slots = layoutSlots(layout);
  return slots.map((s, i) => ({
    slot: s.slot,
    zoom: i === 2 ? 1.15 : 1,
    ox: 0,
    oy: 0,
  }));
}

const state = {
  hero: null,
  side: null,
  layout: 'split3',
  grade: 'sunset',
  caption: 'Sunset Heist',
  captionSize: 104,
  captionColor: '#ffffff',
  selected: 0,
  panelsByLayout: {
    split3: defaultPanels('split3'),
    split2: defaultPanels('split2'),
    hero: defaultPanels('hero'),
  },
};

function panels() {
  return state.panelsByLayout[state.layout];
}

function redraw() {
  drawCover(canvas, { ...state, panels: panels() });
  const slot = layoutSlots(state.layout)[state.selected]?.slot ?? 'hero';
  panelHint.textContent = `Selected panel: ${slot}${state.selected > 0 ? ` ${state.selected + 1}` : ''} — drag to move, scroll to zoom`;
  syncCropControls();
}

function syncCropControls() {
  const p = panels()[state.selected];
  if (!p) return;
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('offx').value = p.ox;
  document.getElementById('offy').value = p.oy;
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

/** Applies a fixed scene (used by ?shot=): photos, layout, grade and caption at once. */
export async function applyShot(scene) {
  state.hero = scene.hero;
  state.side = scene.side;
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.caption = scene.caption;
  state.captionSize = scene.captionSize ?? 104;
  state.captionColor = scene.captionColor ?? '#ffffff';
  state.selected = 0;
  state.panelsByLayout = {
    split3: defaultPanels('split3'),
    split2: defaultPanels('split2'),
    hero: defaultPanels('hero'),
  };
  document.getElementById('caption').value = state.caption;
  document.getElementById('cap-size').value = state.captionSize;
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.grade === state.grade));
  document.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('is-active', b.dataset.color === state.captionColor));
  redraw();
}

const app = { state, panels, redraw, loadImage, applyShot };
window.__app = app;

// --- photo inputs ---
async function pickPhoto(slot, file) {
  if (!file) return;
  try {
    state[slot] = await loadImage(URL.createObjectURL(file));
    status.textContent = `${slot === 'hero' ? 'Hero' : 'Side'} photo loaded.`;
    redraw();
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
}
document.getElementById('photo-hero').addEventListener('change', (e) => pickPhoto('hero', e.target.files[0]));
document.getElementById('photo-side').addEventListener('change', (e) => pickPhoto('side', e.target.files[0]));
document.getElementById('sample').addEventListener('click', async () => {
  try {
    state.hero = await loadImage('samples/pier.jpg');
    state.side = await loadImage('samples/boulevard.jpg');
    status.textContent = 'Sample photos loaded.';
    redraw();
  } catch {
    status.textContent = 'Sample photos could not be loaded.';
  }
});
document.getElementById('swap').addEventListener('click', () => {
  [state.hero, state.side] = [state.side, state.hero];
  redraw();
});

// --- layout / grade / caption ---
document.querySelectorAll('.layout-btn').forEach((b) => b.addEventListener('click', () => {
  state.layout = b.dataset.layout;
  state.selected = 0;
  document.querySelectorAll('.layout-btn').forEach((x) => x.classList.toggle('is-active', x === b));
  redraw();
}));
document.querySelectorAll('.grade-btn').forEach((b) => b.addEventListener('click', () => {
  state.grade = b.dataset.grade;
  document.querySelectorAll('.grade-btn').forEach((x) => x.classList.toggle('is-active', x === b));
  redraw();
}));
document.getElementById('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
document.getElementById('cap-size').addEventListener('input', (e) => { state.captionSize = Number(e.target.value); redraw(); });
document.querySelectorAll('.swatch').forEach((b) => b.addEventListener('click', () => {
  state.captionColor = b.dataset.color;
  document.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('is-active', x === b));
  redraw();
}));

// --- selected-panel crop controls ---
document.getElementById('zoom').addEventListener('input', (e) => { panels()[state.selected].zoom = Number(e.target.value); redraw(); });
document.getElementById('offx').addEventListener('input', (e) => { panels()[state.selected].ox = Number(e.target.value); redraw(); });
document.getElementById('offy').addEventListener('input', (e) => { panels()[state.selected].oy = Number(e.target.value); redraw(); });
document.getElementById('reset-crop').addEventListener('click', () => {
  panels()[state.selected] = { ...panels()[state.selected], zoom: 1, ox: 0, oy: 0 };
  redraw();
});

// --- canvas: click to select a panel, drag to pan, wheel to zoom ---
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const rects = panelRects(canvas, state.layout);
  const i = rects.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  if (i >= 0) {
    state.selected = i;
    drag = { x: p.x, y: p.y, ox: panels()[i].ox, oy: panels()[i].oy };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const scale = canvas.width / 1080;
  const panel = panels()[state.selected];
  panel.ox = Math.max(-200, Math.min(200, drag.ox + (p.x - drag.x) / scale));
  panel.oy = Math.max(-200, Math.min(200, drag.oy + (p.y - drag.y) / scale));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = panels()[state.selected];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// --- export: redraw at the chosen size, save the PNG, restore the preview ---
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = document.getElementById('export-size').value.split('x').map(Number);
  const keepW = canvas.width;
  const keepH = canvas.height;
  canvas.width = w;
  canvas.height = h;
  redraw();
  canvas.toBlob((blob) => {
    canvas.width = keepW;
    canvas.height = keepH;
    redraw();
    if (!blob) {
      status.textContent = 'Export failed — the browser could not make the PNG.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-nights-${w}x${h}.png`;
  }, 'image/png');
});

// --- start: fixed scene for screenshots, else the sample photos ---
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), app);
} else {
  loadImage('samples/pier.jpg').then((img) => { state.hero = img; redraw(); }).catch(() => redraw());
  loadImage('samples/boulevard.jpg').then((img) => { state.side = img; redraw(); }).catch(() => redraw());
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
}
