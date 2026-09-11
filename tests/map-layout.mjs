import assert from "node:assert/strict";
import { loadGame } from "./harness.mjs";

const { game: g } = await loadGame();
g.startNewGame();
for (let i = 0; i < 4; i++) g.input("enter");
const overlap = (a, b) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

// Measure rendered artwork, not collision footprints: foliage, cabinet tops,
// and furniture backs can cover another object even when both feet are clear.
function artworkBounds(canvas, ox, oy) {
  const pixels = canvas
    .getContext("2d")
    .getImageData(0, 0, canvas.width, canvas.height).data;
  let left = canvas.width,
    right = 0,
    top = canvas.height,
    bottom = 0;
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++)
      if (pixels[(y * canvas.width + x) * 4 + 3] > 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  return {
    x: ox + left,
    y: oy + top,
    w: right - left + 1,
    h: bottom - top + 1,
  };
}

let pairs = 0;
for (const [zone, d] of Object.entries(g.DISTRICTS)) {
  g.state.zone = zone;
  Object.assign(g.state.player, { x: d.spawn[0], y: d.spawn[1] });
  g.resetTrail();
  const scenery = d.objects
    .filter((o) => !["water", "seal", "gap"].includes(o[0]))
    .map((o, i) => {
      const frame = g.sceneryFrame(o);
      return {
        id: o[0] + i,
        kind: o[0],
        ...artworkBounds(
          frame.canvas,
          o[1] - frame.pad,
          o[2] - frame.rise - frame.pad,
        ),
      };
    });
  for (const stage of [0, 9]) {
    g.state.mainStage = stage;
    const items = g.interactables().filter((it) => !it.hidden?.());
    const entries = [
      ...scenery,
      ...items
        .filter((it) => !it.travel)
        .map((it) => {
          const h =
            it.boss || ["sentinel", "fixer", "chair"].includes(it.id)
              ? 100
              : 60;
          return { id: it.id, x: it.x - 25, y: it.y - h, w: 50, h };
        }),
      ...g
        .npcList()
        .map((n) => ({ id: n.id, x: n.x - 25, y: n.y - 80, w: 50, h: 80 })),
      ...g.WORLD_ENCOUNTERS[zone].map((n) => ({
        id: n.id,
        x: n.x - 30,
        y: n.y - 80,
        w: 60,
        h: 80,
      })),
    ];
    for (let i = 0; i < entries.length; i++)
      for (const b of entries.slice(i + 1)) {
        const a = entries[i];
        if (a.kind === "wall" && b.kind === "wall") continue; // Joined room corners.
        pairs++;
        assert(overlap(a, b) <= 100, `${zone}: ${a.id} overlaps ${b.id}`);
      }
  }
  // Patrols must not drift back into witnesses or quest/service markers.
  const motion = g.getMobMotion();
  for (const key of Object.keys(motion)) delete motion[key];
  for (let tick = 0; tick < 600; tick++) {
    g.updateMobs(1 / 30);
    for (const [key, mob] of Object.entries(motion))
      for (const target of [
        ...g.npcList(),
        ...g.interactables().filter((it) => !it.hidden?.()),
      ])
        assert(
          Math.abs(mob.x - target.x) >= 60 || Math.abs(mob.y - target.y) >= 90,
          `${zone}: ${key} patrol covers ${target.id}`,
        );
  }
}

g.state.zone = "MALL";
for (const id of ["rest", "travel", "upgrade", "tutorial", "trials"]) {
  const target = g.interactables().find((it) => it.id === id);
  Object.assign(g.state.player, { x: target.x, y: target.y + 45 });
  g.resetTrail();
  g.setMode("world");
  g.draw();
  assert.equal(
    g.worldFocus().data.id,
    id,
    "focus must match the available action",
  );
  const label = g.worldFocusLabel();
  assert(label.label.startsWith("E · "));
  assert(label.y >= g.state.player.y + 20, "label covers party feet");
}
console.log(
  `Map layout: ${pairs} artwork pairs, 12 patrol simulations, and service focus labels passed.`,
);
