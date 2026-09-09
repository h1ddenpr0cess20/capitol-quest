import { readFile } from "node:fs/promises";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import vm from "node:vm";
import assert from "node:assert/strict";

const masks = JSON.parse(await readFile("assets/sprite_masks.json", "utf8"));
const spriteFrame = vm.runInNewContext(
  `${await readFile("src/rendering/frame-cache.js", "utf8")};spriteFrame`,
  {
    SPRITE_MASKS: masks,
    document: { createElement: () => createCanvas(1, 1) },
  },
);
// Reviewed background pixels paired with neighboring artwork that must stay.
// These are independent visual fixtures, not copies of the masking rules.
const fixtures = {
  "actors/enemy/PROTESTER/0/0": { clear: [[60, 43]], keep: [[35, 50]] },
  "actors/enemy/FARMER/0/0": {
    clear: [
      [55, 44],
      [56, 85],
    ],
    keep: [[30, 20]],
  },
  "actors/enemy/SENIOR/0/0": { clear: [[65, 83]], keep: [[54, 85]] },
  "actors/action/LUTNICK/1/0": { clear: [[65, 11]], keep: [[60, 40]] },
  "props/DESK/0": { clear: [[35, 10]], keep: [[20, 25]] },
  "props/THRONE/0": {
    clear: [[1, 10]],
    keep: [
      [5, 10],
      [15, 25],
    ],
  },
  "landmarks/FOUNTAIN/0": { clear: [[1, 20]], keep: [[15, 20]] },
  "landmarks/MONUMENT/0": { clear: [[40, 98]], keep: [[20, 90]] },
  "extras/explosion/0": { clear: [[56, 25]], keep: [[25, 25]] },
};
const counts = {};
let removed = 0,
  checkedFixtures = 0;
for (const sheet of ["extras", "props", "actors", "landmarks"]) {
  const image = await loadImage(`assets/${sheet}.png`);
  let defs;
  if (sheet === "extras" || sheet === "props")
    defs = vm.runInNewContext(
      `${await readFile(`src/data/${sheet}.js`, "utf8")};${sheet === "extras" ? "EXTRA" : "PROPS"}`,
    );
  else if (sheet === "actors") {
    const act = JSON.parse(
      await readFile("assets/actors_manifest.json", "utf8"),
    );
    defs = Object.fromEntries(
      Object.entries(act).flatMap(([group, entries]) =>
        Object.entries(entries).flatMap(([key, frames]) =>
          (Array.isArray(frames) ? frames : [frames]).map((f, i) => [
            `${group}/${key}/${i}`,
            f.r,
          ]),
        ),
      ),
    );
  } else
    defs = JSON.parse(await readFile("assets/landmarks_manifest.json", "utf8"));
  for (const [key, rs] of Object.entries(defs))
    for (const [i, r] of (Array.isArray(rs[0]) ? rs : [rs]).entries()) {
      counts[sheet] = (counts[sheet] || 0) + 1;
      const original = createCanvas(r[2], r[3]),
        oc = original.getContext("2d");
      oc.drawImage(image, ...r, 0, 0, r[2], r[3]);
      const clean = spriteFrame(sheet, image, r),
        a = oc.getImageData(0, 0, r[2], r[3]).data,
        b = clean.getContext("2d").getImageData(0, 0, r[2], r[3]).data;
      assert.equal(clean.width, r[2]);
      assert.equal(clean.height, r[3]);
      assert.equal(spriteFrame(sheet, image, r), clean, "frames are cached");
      let before = 0,
        after = 0;
      for (let p = 0; p < a.length; p += 4) {
        if (a[p + 3]) before++;
        if (b[p + 3]) {
          after++;
          assert.deepEqual(
            [...b.slice(p, p + 4)],
            [...a.slice(p, p + 4)],
            "kept pixels are identical",
          );
        } else if (a[p + 3]) removed++;
      }
      assert(
        before === 0 || after > before * 0.25,
        `${sheet}/${key}/${i}: erased too much (${after}/${before})`,
      );
      if (sheet === "actors")
        assert(after > before * 0.88, "actor silhouette was damaged: " + key);
      const label = `${sheet}/${key}/${i}`,
        fixture = fixtures[label];
      if (fixture) {
        checkedFixtures++;
        for (const [kind, points] of Object.entries(fixture))
          for (const [x, y] of points) {
            const alpha = (y * r[2] + x) * 4 + 3;
            assert(
              a[alpha] > 0,
              `${label}: fixture must sample visible source artwork`,
            );
            assert.equal(
              b[alpha],
              kind === "clear" ? 0 : a[alpha],
              `${label}: ${kind} pixel ${x},${y}`,
            );
          }
      }
    }
}
assert.deepEqual(counts, { extras: 55, props: 11, actors: 54, landmarks: 5 });
assert.equal(
  checkedFixtures,
  Object.keys(fixtures).length,
  "every visual fixture ran",
);
console.log(
  `Sprites: ${Object.keys(masks).length} masked frames, ${removed} background pixels hidden; frame sizes and retained pixels unchanged.`,
);
