function drawItem(key, x, y, size = 38) {
  const r = EXTRA[key];
  if (!r) return;
  const sc = size / Math.max(r[2], r[3]);
  drawExtra(
    key,
    x - (r[2] * sc) / 2,
    y - (r[3] * sc) / 2,
    r[2] * sc,
    r[3] * sc,
  );
}

function drawAtlasRect(r, x, y, w, h, alpha = 1) {
  if (!atlasReady || !r) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    atlas,
    r[0],
    r[1],
    r[2],
    r[3],
    Math.round(x),
    Math.round(y),
    Math.round(w),
    Math.round(h),
  );
  ctx.restore();
}

function drawLandmark(name, x, y, scale = 1, alpha = 1) {
  const r = LAND[name];
  if (!landmarkAtlasReady || !r) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    spriteFrame("landmarks", landmarkAtlas, r),
    Math.round(x),
    Math.round(y),
    r[2] * scale,
    r[3] * scale,
  );
  ctx.restore();
}

function drawActorFrame(meta, x, footY, scale = 1, flip = false, alpha = 1) {
  if (!actorAtlasReady || !meta) return;
  const r = meta.r,
    a = meta.a,
    dw = Math.round(r[2] * scale),
    dh = Math.round(r[3] * scale),
    ax = Math.round(a[0] * scale),
    ay = Math.round(a[1] * scale);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(footY));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(spriteFrame("actors", actorAtlas, r), -ax, -ay, dw, dh);
  ctx.restore();
}

function drawPortrait(key, x, y, w, h) {
  const r = A.portraits[key];
  if (r) drawImageRect(r, x, y, w, h);
}

function drawNpcSprite(name, x, footY, scale = 1, flip = false, alpha = 1) {
  drawActorFrame(ACT.npc[name], x, footY, scale, flip, alpha);
}

function drawExtra(key, x, y, w, h, frame = 0) {
  const q = EXTRA[key];
  const r = Array.isArray(q?.[0]) ? q[frame] : q;
  if (!r || !extraAtlas.complete || !extraAtlas.naturalWidth) return;
  ctx.drawImage(
    spriteFrame("extras", extraAtlas, r),
    Math.round(x),
    Math.round(y),
    Math.round(w),
    Math.round(h),
  );
}

function drawProp(key, x, y, w, h) {
  const r = PROPS[key];
  if (!r || !propsAtlas.width) return;
  const sc = Math.min(w / r[2], h / r[3]),
    dw = Math.round(r[2] * sc),
    dh = Math.round(r[3] * sc);
  ctx.drawImage(
    spriteFrame("props", propsAtlas, r),
    Math.round(x + (w - dw) / 2),
    Math.round(y + h - dh),
    dw,
    dh,
  );
}

function drawPartySprite(name, dir, frame, x, y, scale = 1, alpha = 1) {
  const base = {
      TRUMP: 77,
      HEGSETH: 84,
      LUTNICK: 81,
      RFK: 97,
    }[name],
    sc = (72 / base) * scale;
  const meta = walkMeta(name, dir, frame);
  drawActorFrame(meta, x, y, sc, dir === "left", alpha);
}

function drawImageRect(r, x, y, w, h, alpha = 1) {
  const key = Object.keys(A.interior).find((k) => A.interior[k] === r);
  if (key && PROPS[key]) {
    ctx.save();
    ctx.globalAlpha = alpha;
    drawProp(key, x, y, w, h);
    ctx.restore();
    return;
  }
  drawAtlasRect(r, x, y, w, h, alpha);
}

function drawFacingEnemy(name, x, y, scale, dir = "left", alpha = 1) {
  drawActorFrame(
    ACT.enemy[name],
    x,
    y,
    scale,
    ENEMY_FACING[name] !== dir,
    alpha,
  );
}

function walkMeta(name, dir, frame) {
  const seq =
    WALK_FRAMES[name][dir === "left" ? "right" : dir] || WALK_FRAMES[name].down;
  return ACT.walk[name][seq[Math.abs(frame | 0) % 4]];
}

function drawEnemySprite(name, x, y, scale = 1, flip = false, alpha = 1) {
  drawFacingEnemy(name, x, y, scale, flip ? "right" : "left", alpha);
}
