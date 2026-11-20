// Renders the cover: a multi-panel poster from two photos, a colour grade and a bold caption.
// The state shape (owned by main.js) is:
//   { hero, side, layout, grade, caption, captionSize, captionColor, panels }
// where `panels` holds one crop per panel slot of the current layout:
//   { slot: 'hero' | 'side', zoom: 1..2.5, ox: -200..200, oy: -200..200 }
// Sizes and offsets are written in "1080 units" (pixels at 1080 px wide) and scaled by the
// canvas width, so a cover looks the same at 1080 x 1080, 1080 x 1350 and 1920 x 1080.

const GUTTER = 6; // dark divider between panels, in 1080 units
const GRADES = {
  sunset: {
    filter: 'saturate(1.3) contrast(1.06) brightness(1.02)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255,170,60,0)'], [0.55, 'rgba(255,90,80,0.10)'], [1, 'rgba(200,30,120,0.42)']] },
      { kind: 'flat', color: 'rgba(255,120,40,0.08)', blend: 'soft-light' },
    ],
  },
  neon: {
    filter: 'saturate(1.7) contrast(1.12)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [1, 1], stops: [[0, 'rgba(255,0,128,0.30)'], [0.5, 'rgba(120,0,180,0.10)'], [1, 'rgba(0,229,255,0.28)']] },
    ],
  },
  golden: {
    filter: 'saturate(1.35) contrast(1.04) brightness(1.05)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255,200,90,0.05)'], [1, 'rgba(255,140,30,0.30)']] },
      { kind: 'flat', color: 'rgba(255,180,60,0.10)', blend: 'soft-light' },
    ],
  },
  noir: {
    filter: 'grayscale(1) contrast(1.3) brightness(1.06)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], stops: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.35)']] },
    ],
  },
};

/** Panel rectangles for a layout, as fractions of the canvas. Each entry names its slot. */
export function layoutSlots(layout) {
  if (layout === 'split2') return [
    { slot: 'hero', x: 0, y: 0, w: 0.62, h: 1 },
    { slot: 'side', x: 0.62, y: 0, w: 0.38, h: 1 },
  ];
  if (layout === 'hero') return [{ slot: 'hero', x: 0, y: 0, w: 1, h: 1 }];
  return [
    { slot: 'hero', x: 0, y: 0, w: 0.62, h: 1 },
    { slot: 'side', x: 0.62, y: 0, w: 0.38, h: 0.5 },
    { slot: 'hero', x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
  ];
}

/** Panel rectangles in canvas pixels, for hit-testing. */
export function panelRects(canvas, layout) {
  const { width: w, height: h } = canvas;
  return layoutSlots(layout).map((s) => ({ slot: s.slot, x: s.x * w, y: s.y * h, w: s.w * w, h: s.h * h }));
}

function drawPanel(ctx, rect, img, crop, grade, scale) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (img) {
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const s = base * crop.zoom;
    const pw = img.naturalWidth * s;
    const ph = img.naturalHeight * s;
    ctx.filter = grade.filter;
    ctx.drawImage(img, x + (w - pw) / 2 + crop.ox * scale, y + (h - ph) / 2 + crop.oy * scale, pw, ph);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#3a1c52');
    g.addColorStop(1, '#160a24');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  for (const o of grade.overlays) {
    if (o.kind === 'flat') {
      ctx.globalCompositeOperation = o.blend ?? 'source-over';
      ctx.fillStyle = o.color;
      ctx.fillRect(x, y, w, h);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const g = ctx.createLinearGradient(x + o.from[0] * w, y + o.from[1] * h, x + o.to[0] * w, y + o.to[1] * h);
      for (const [at, color] of o.stops) g.addColorStop(at, color);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
  }
  // Vignette: darken the panel edges so the poster reads as one picture.
  const v = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Draws the whole cover onto the canvas at its own size, from the state. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const scale = w / 1080; // 1080 units -> canvas pixels
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const g = GUTTER * scale;
  ctx.fillStyle = '#0d0514';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(canvas, state.layout);
  rects.forEach((rect, i) => {
    const slot = layoutSlots(state.layout)[i];
    const crop = state.panels[i] ?? { slot: slot.slot, zoom: 1, ox: 0, oy: 0 };
    const img = crop.slot === 'side' ? state.side : state.hero;
    drawPanel(ctx, rect, img, crop, grade, scale);
  });

  // Dark dividers between panels.
  ctx.fillStyle = '#0d0514';
  for (const r of rects) {
    if (r.x > 0) ctx.fillRect(r.x - g / 2, r.y, g, r.h);
    if (r.y > 0) ctx.fillRect(r.x, r.y - g / 2, r.w, g);
  }

  // Caption band: a dark gradient rising from the foot, then the bold words.
  const text = (state.caption ?? '').trim().toUpperCase();
  if (text) {
    const band = ctx.createLinearGradient(0, h * 0.62, 0, h);
    band.addColorStop(0, 'rgba(10,4,18,0)');
    band.addColorStop(1, 'rgba(10,4,18,0.72)');
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);

    const heroW = rects[0].w;
    let size = (state.captionSize || 104) * scale;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`; } catch { /* older canvas: no letterSpacing */ }
    const setFont = (s) => { ctx.font = `900 ${s}px 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif`; };
    setFont(size);
    const maxW = (state.layout === 'hero' ? w : heroW) * 0.92;
    while (ctx.measureText(text).width > maxW && size > 12 * scale) {
      size -= 2 * scale;
      setFont(size);
    }
    const cx = state.layout === 'hero' ? w / 2 : rects[0].x + rects[0].w / 2;
    const cy = h - h * 0.06;
    // Accent rule above the words.
    const ruleW = Math.min(maxW * 0.5, 320 * scale);
    const rg = ctx.createLinearGradient(cx - ruleW / 2, 0, cx + ruleW / 2, 0);
    rg.addColorStop(0, '#ff9a3d');
    rg.addColorStop(0.5, '#ff2e88');
    rg.addColorStop(1, '#b537f2');
    ctx.fillStyle = rg;
    ctx.fillRect(cx - ruleW / 2, cy - size * 1.15, ruleW, Math.max(3, size * 0.045));
    // Outlined, shadowed words.
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0d0514';
    ctx.lineWidth = size * 0.16;
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    ctx.strokeText(text, cx, cy);
    ctx.fillStyle = state.captionColor || '#ffffff';
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}
