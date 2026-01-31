const visualCache = new Map();

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
  img.src = `visuals/${key}/${key}.jpg`;
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
