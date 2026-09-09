const spriteFrames = new Map();

function spriteFrame(sheet, image, rect) {
  const key = sheet + ":" + rect.join(",");
  if (spriteFrames.has(key)) return spriteFrames.get(key);
  const frame = document.createElement("canvas");
  frame.width = rect[2];
  frame.height = rect[3];
  const context = frame.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.drawImage(image, ...rect, 0, 0, frame.width, frame.height);
  for (const [x, y, width] of SPRITE_MASKS[key] || [])
    context.clearRect(x, y, width, 1);
  spriteFrames.set(key, frame);
  return frame;
}
