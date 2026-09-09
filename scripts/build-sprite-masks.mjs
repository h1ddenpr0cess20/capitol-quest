import { readFile, writeFile } from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import vm from "node:vm";
import { actorMaskRuns } from "./actor-masks.mjs";

// Only transparency metadata is produced. The original PNGs, frame rectangles,
// RGB artwork and foot anchors are never rewritten or resampled.
export function isMatte(r, g, b, profile) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  if (profile === "tree")
    return (b > r * 1.05 && b > g * 0.92) || (min > 90 && max - min < 24);
  if (profile === "slash") return min > 80 && max < 190 && max - min < 45;
  if (profile === "throne") return r > g * 1.8 && b >= g * 0.8;
  if (profile === "desk")
    return min > 25 && (b >= g || r < g * 1.25) && max - min < 65;
  if (profile === "explosion")
    return r > 150 && r < 232 && g > 70 && b > 54 && r - g < 135;
  if (profile === "prop") return min > 165 && max - min < 65;
  if (profile === "heal") return min > 35 && max < 180 && max - min < 95;
  return min > 60 && max < 190 && max - min < 80;
}

export function matteRuns(data, width, height, profile) {
  if (profile === "actor") return [];
  const seen = new Uint8Array(width * height),
    remove = new Uint8Array(width * height),
    queue = [];
  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x,
      i = p * 4;
    if (seen[p]) return;
    seen[p] = 1;
    if (!data[i + 3] || isMatte(data[i], data[i + 1], data[i + 2], profile)) {
      queue.push(p);
      if (data[i + 3]) remove[p] = 1;
    }
  }
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i],
      x = p % width,
      y = Math.floor(p / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
  // Item interiors can share the matte color (paper, stone, banknotes).
  // Retain the span between each row's surviving outline pixels.
  if (profile === "prop" || profile === "item") {
    for (let y = 0; y < height; y++) {
      let left = width,
        right = -1;
      for (let x = 0; x < width; x++) {
        const p = y * width + x;
        if (data[p * 4 + 3] && !remove[p]) {
          left = Math.min(left, x);
          right = x;
        }
      }
      for (let x = left; x <= right; x++) remove[y * width + x] = 0;
    }
  }
  // The lower foliage is blue-green shadow, not the blue matte surrounding
  // the canopy. Keep its reviewed interior silhouette connected to the trunk.
  if (profile === "tree") {
    const contour = [
      [0, 20, 25],
      [5, 12, 31],
      [12, 7, 35],
      [22, 4, 38],
      [34, 5, 38],
      [42, 8, 35],
      [48, 12, 32],
      [52, 16, 29],
    ];
    for (let k = 1; k < contour.length; k++) {
      const [ya, la, ra] = contour[k - 1],
        [yb, lb, rb] = contour[k];
      for (let y = ya; y <= yb; y++) {
        const t = (y - ya) / (yb - ya),
          left = Math.ceil(la + (lb - la) * t),
          right = Math.floor(ra + (rb - ra) * t);
        for (let x = left; x <= right; x++) remove[y * width + x] = 0;
      }
    }
  }
  const runs = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width;) {
      if (!remove[y * width + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < width && remove[y * width + x]) x++;
      runs.push([start, y, x - start]);
    }
  return runs;
}

export async function buildSpriteMasks() {
  const actors = JSON.parse(
    await readFile("assets/actors_manifest.json", "utf8"),
  );
  const landmarks = JSON.parse(
    await readFile("assets/landmarks_manifest.json", "utf8"),
  );
  const extras = vm.runInNewContext(
    `${await readFile("src/data/extras.js", "utf8")}; EXTRA`,
  );
  const props = vm.runInNewContext(
    `${await readFile("src/data/props.js", "utf8")}; PROPS`,
  );
  const masks = {};
  for (const [sheet, frames] of [
    [
      "actors",
      Object.entries(actors).flatMap(([group, entries]) =>
        Object.entries(entries).flatMap(([key, metas]) =>
          (Array.isArray(metas) ? metas : [metas]).map((meta, index) => ({
            key: `${group}/${key}/${index}`,
            r: meta.r,
            profile: "actor",
          })),
        ),
      ),
    ],
    [
      "extras",
      Object.entries(extras).flatMap(([key, rs]) =>
        (Array.isArray(rs[0]) ? rs : [rs]).map((r, index) => ({
          key: `${key}/${index}`,
          r,
          profile:
            key === "explosion"
              ? "explosion"
              : key === "hit"
                ? "slash"
                : key === "heal" && index > 0
                  ? "heal"
                  : key === "money" || key === "heal" || /^[A-Z]+$/.test(key)
                    ? "item"
                    : "effect",
        })),
      ),
    ],
    [
      "props",
      Object.entries(props).map(([key, r]) => ({
        key,
        r,
        profile: key === "THRONE" ? "throne" : key === "DESK" ? "desk" : "prop",
      })),
    ],
    [
      "landmarks",
      Object.entries(landmarks).map(([key, r]) => ({
        key,
        r,
        profile: key === "TREE" ? "tree" : "actor",
      })),
    ],
  ]) {
    const image = await loadImage(`assets/${sheet}.png`);
    for (const { key, r, profile } of frames) {
      const canvas = createCanvas(r[2], r[3]),
        ctx = canvas.getContext("2d");
      ctx.drawImage(image, ...r, 0, 0, r[2], r[3]);
      const pixels = ctx.getImageData(0, 0, r[2], r[3]).data;
      const runs =
        sheet === "actors"
          ? actorMaskRuns(pixels, r[2], r[3], key)
          : matteRuns(pixels, r[2], r[3], profile);
      // Neighboring-row fragments included by the original effect crops.
      const trims = {
        "gun/0": [[0, 36, 64, 16]],
        "gun/2": [[0, 29, 55, 10]],
        "money/1": [[0, 25, 28, 5]],
        "money/6": [[0, 0, 4, 39]],
        "heal/5": [[0, 0, 55, 12]],
        "debuff/0": [[0, 37, 47, 8]],
        "debuff/2": [[0, 43, 48, 3]],
        "debuff/3": [[0, 42, 45, 2]],
        "buff/5": [[0, 0, 3, 31]],
        "buff/7": [[0, 0, 5, 49]],
      };
      if (sheet === "extras")
        for (const [x, y, w, h] of trims[key] || [])
          for (let row = y; row < y + h; row++) runs.push([x, row, w]);
      if (sheet === "props" && key === "THRONE")
        for (let y = 0; y < r[3]; y++) {
          if (y < 20) runs.push([0, y, 4], [27, y, 7]);
          if (y > 37) runs.push([0, y, 4], [27, y, 7]);
          if (y > 33) runs.push([30, y, 4]);
          if (y >= 44) runs.push([0, y, r[2]]);
        }
      if (sheet === "props" && key === "PLANT")
        for (let y = 0; y < r[3]; y++) {
          runs.push([0, y, 1]);
          if (y >= 48) runs.push([25, y, 5]);
        }
      if (sheet === "props" && key === "FLAG")
        for (let y = 73; y < r[3]; y++)
          for (let x = 0; x < r[2]; x++) {
            const p = (y * r[2] + x) * 4,
              [red, green, blue] = pixels.slice(p, p + 3);
            if (
              Math.min(red, green, blue) > 45 &&
              red - green < 25 &&
              Math.max(red, green, blue) - Math.min(red, green, blue) < 65
            )
              runs.push([x, y, 1]);
          }
      if (sheet === "landmarks" && key === "MONUMENT")
        for (let y = 88; y < 105; y++)
          for (let x = 0; x < r[2]; x++) {
            const p = (y * r[2] + x) * 4,
              [red, green, blue] = pixels.slice(p, p + 3);
            if ((x < 8 || x > 26) && blue >= red && red < 180)
              runs.push([x, y, 1]);
          }
      if (sheet === "landmarks" && key === "FOUNTAIN")
        for (let y = 0; y < r[3]; y++) {
          // Water jet and basin; discard the architecture and vegetation
          // included around them by the source-sheet crop.
          const left = y < 5 ? 11 : y < 38 ? 9 : 4;
          const right = y < 5 ? 21 : y < 38 ? 22 : 29;
          runs.push([0, y, left], [right, y, r[2] - right]);
          if (y >= 59) runs.push([0, y, r[2]]);
        }
      if (sheet === "landmarks" && key === "WHITEHOUSE")
        runs.push([0, 73, r[2]]);
      if (sheet === "landmarks" && key === "TREE")
        for (let y = 0; y < r[3]; y++) runs.push([40, y, 3]);
      if (runs.length) masks[`${sheet}:${r.join(",")}`] = runs;
    }
  }
  await writeFile("assets/sprite_masks.json", JSON.stringify(masks) + "\n");
  console.log(
    `Prepared transparency masks for ${Object.keys(masks).length} frames`,
  );
  return masks;
}

if (process.argv[1]?.endsWith("build-sprite-masks.mjs"))
  await buildSpriteMasks();
