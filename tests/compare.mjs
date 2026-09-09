import assert from "node:assert/strict";
import { loadGame } from "./harness.mjs";
const before = await loadGame({ baseline: true });
const after = await loadGame({ masks: false });
const plain = (v) => JSON.parse(JSON.stringify(v));
assert.deepEqual(
  plain(after.game.freshState()),
  plain(before.game.freshState()),
);
assert.deepEqual(plain(after.game.state), plain(before.game.state));
for (const g of [before.game, after.game]) {
  g.startNewGame();
  for (let i = 0; i < 4; i++) g.input("enter");
}
assert.deepEqual(plain(after.game.state), plain(before.game.state));
for (const zone of Object.keys(before.game.DISTRICTS)) {
  for (const { game: g } of [before, after]) {
    g.state.zone = zone;
    g.state.player.x = g.MAPS[zone].spawn.x;
    g.state.player.y = g.MAPS[zone].spawn.y;
    g.resetTrail();
    g.draw();
  }
  assert.deepEqual(
    plain(
      after.game
        .interactables()
        .map(({ id, x, y, label }) => ({ id, x, y, label })),
    ),
    plain(
      before.game
        .interactables()
        .map(({ id, x, y, label }) => ({ id, x, y, label })),
    ),
  );
  assert.deepEqual(
    plain(after.game.worldSolids(zone)),
    plain(before.game.worldSolids(zone)),
  );
  const a = after.canvas.getContext("2d").getImageData(0, 0, 1280, 720).data,
    b = before.canvas.getContext("2d").getImageData(0, 0, 1280, 720).data;
  let changed = 0;
  for (let i = 0; i < a.length; i += 4)
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])
      changed++;
  assert(
    changed < 1280 * 720 * 0.003,
    zone + " layout changed: " + changed + " pixels",
  );
}
console.log(
  "Refactor parity: initial state, new game, twelve district renders, interactables and collisions match.",
);
