const visualCache = new Map();
const visualSources = {
  player_1: 'visuals/player/Player_1.jpg',
  player_2: 'visuals/player/Player_2.jpg',
  player_mask_1: 'visuals/Mask/Player_Mask_1.jpg',
  player_mask_2: 'visuals/Mask/Player_Mask_2.jpg',
};

function getVisualRecord(key) {
  if (visualCache.has(key)) {
    return visualCache.get(key);
  }
  const img = new Image();
  const record = { img, status: 'loading' };
  img.onload = () => {
    record.status = 'ready';
  };
  img.onerror = () => {
    record.status = 'error';
  };
  img.src = visualSources[key] ?? `visuals/${key}/${key}.jpg`;
  visualCache.set(key, record);
  return record;
}

function getVisualImage(key) {
  const record = getVisualRecord(key);
  if (record.status !== 'ready') {
    return null;
  }
  if (!record.img.complete || record.img.naturalWidth === 0) {
    return null;
  }
  return record.img;
}

function drawVisualCentered(ctx, key, x, y, width, height, options = {}) {
  const img = getVisualImage(key);
  if (!img) return false;
  ctx.save();
  if (options.shadowColor) {
    ctx.shadowColor = options.shadowColor;
    ctx.shadowBlur = options.shadowBlur ?? 0;
  }
  if (typeof options.globalAlpha === 'number') {
    ctx.globalAlpha = options.globalAlpha;
  }
  ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
  ctx.restore();
  return true;
}

function drawVisualTopLeft(ctx, key, x, y, width, height, options = {}) {
  const img = getVisualImage(key);
  if (!img) return false;
  ctx.save();
  if (options.shadowColor) {
    ctx.shadowColor = options.shadowColor;
    ctx.shadowBlur = options.shadowBlur ?? 0;
  }
  if (typeof options.globalAlpha === 'number') {
    ctx.globalAlpha = options.globalAlpha;
  }
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
  return true;
}

export { drawVisualCentered, drawVisualTopLeft };
