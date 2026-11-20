// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos; ?shot=cover
// shows the cover alone; ?shot=panels shows the two-panel neon layout; ?shot=export shows the
// single-panel golden cover. window.__shotReady is set once painted.
const SCENES = {
  cover: { layout: 'split3', grade: 'sunset', hero: 'pier', side: 'boulevard', caption: 'Sunset Heist', hideControls: true },
  editor: { layout: 'split3', grade: 'sunset', hero: 'pier', side: 'boulevard', caption: 'Boulevard Queen', hideControls: false },
  panels: { layout: 'split2', grade: 'neon', hero: 'boulevard', side: 'pier', caption: 'Neon Nights', hideControls: false },
  export: { layout: 'hero', grade: 'golden', hero: 'pier', side: 'boulevard', caption: 'Golden Hour', hideControls: true },
};

export async function runShot(shot, query, app) {
  const scene = SCENES[shot] ?? SCENES.editor;
  if (query.get('caption')) scene.caption = query.get('caption');
  if (query.get('grade')) scene.grade = query.get('grade');
  if (query.get('layout')) scene.layout = query.get('layout');
  if (scene.hideControls) document.body.classList.add('shot-cover');
  const hero = await app.loadImage(`samples/${scene.hero}.jpg`);
  const side = await app.loadImage(`samples/${scene.side}.jpg`);
  await app.applyShot({ ...scene, hero, side });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}
