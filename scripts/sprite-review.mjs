import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import vm from "node:vm";

// Render every frame, including those requiring no changes, so reviews cannot
// silently skip a character or sprite category. Left: source. Right: cleaned.
const masks = JSON.parse(await readFile("assets/sprite_masks.json", "utf8"));
const renderFrame = vm.runInNewContext(
  `${await readFile("src/rendering/frame-cache.js", "utf8")}; spriteFrame`,
  {
    SPRITE_MASKS: masks,
    document: { createElement: () => createCanvas(1, 1) },
  },
);
const actors = JSON.parse(
  await readFile("assets/actors_manifest.json", "utf8"),
);
const groups = [];
for (const [kind, entries] of Object.entries(actors)) {
  const frames = Object.entries(entries).flatMap(([name, values]) =>
    (Array.isArray(values) ? values : [values]).map((frame, i) => ({
      label: `${name}/${i}`,
      rect: frame.r,
    })),
  );
  for (let i = 0; i < frames.length; i += 6)
    groups.push({
      name: `actors-${kind}-${i / 6}`,
      sheet: "actors",
      frames: frames.slice(i, i + 6),
    });
}
for (const sheet of ["props", "landmarks", "extras"]) {
  const data =
    sheet === "landmarks"
      ? JSON.parse(await readFile("assets/landmarks_manifest.json", "utf8"))
      : vm.runInNewContext(
          `${await readFile(`src/data/${sheet}.js`, "utf8")};${sheet === "props" ? "PROPS" : "EXTRA"}`,
        );
  const frames = Object.entries(data).flatMap(([name, rects]) =>
    (Array.isArray(rects[0]) ? rects : [rects]).map((rect, i) => ({
      label: `${name}/${i}`,
      rect,
    })),
  );
  for (let i = 0; i < frames.length; i += 6)
    groups.push({
      name: `${sheet}-${i / 6}`,
      sheet,
      frames: frames.slice(i, i + 6),
    });
}
await mkdir(".tmp/review", { recursive: true });
const inventory = [];
for (const group of groups) {
  const image = await loadImage(`assets/${group.sheet}.png`);
  const canvas = createCanvas(1200, Math.ceil(group.frames.length / 3) * 370),
    ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for (const [i, { label, rect }] of group.frames.entries()) {
    const x = (i % 3) * 400,
      y = Math.floor(i / 3) * 370,
      scale = Math.min(2.6, 180 / rect[2], 310 / rect[3]);
    ctx.fillStyle = "#182c40";
    ctx.fillRect(x, y, 400, 370);
    ctx.fillStyle = "#a84870";
    ctx.fillRect(x, y + 185, 400, 185);
    ctx.fillStyle = "white";
    ctx.font = "15px sans-serif";
    ctx.fillText(`${label} · source / cleaned`, x + 8, y + 22);
    ctx.drawImage(
      image,
      ...rect,
      x + 8,
      y + 45,
      rect[2] * scale,
      rect[3] * scale,
    );
    ctx.drawImage(
      renderFrame(group.sheet, image, rect),
      x + 208,
      y + 45,
      rect[2] * scale,
      rect[3] * scale,
    );
    inventory.push({
      sheet: group.sheet,
      frame: label,
      rect,
      masked: !!masks[`${group.sheet}:${rect.join(",")}`],
    });
  }
  await writeFile(
    `.tmp/review/${group.name}.png`,
    canvas.toBuffer("image/png"),
  );
}
await writeFile(
  ".tmp/review/inventory.json",
  JSON.stringify(inventory, null, 2),
);
console.log(
  `Rendered all ${inventory.length} frames in ${groups.length} review pages.`,
);
