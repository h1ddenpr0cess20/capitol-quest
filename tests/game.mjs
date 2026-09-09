import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { loadGame } from "./harness.mjs";

const { game: g, canvas, storage, window } = await loadGame();
const plain = (value) => JSON.parse(JSON.stringify(value));
await mkdir(".tmp", { recursive: true });
g.draw();
g.startNewGame();
for (let i = 0; i < 4; i++) g.input("enter");
assert.equal(g.mode, "world");
assert.equal(g.state.party.length, 4);
assert(g.state.party.every((p) => p.lvl === 1));
g.state.mainStage = 9;
g.state.settings.sound = false;

for (const zone of Object.keys(g.DISTRICTS)) {
  g.state.zone = zone;
  Object.assign(g.state.player, g.MAPS[zone].spawn);
  g.resetTrail();
  g.update(0);
  g.draw();
  assert(
    g.interactables().some((i) => i.id === "rest"),
    zone + ": missing rest point",
  );
  const route = g.findPath(g.state.player, {
    x: g.state.player.x + 64,
    y: g.state.player.y,
  });
  assert(route.length, zone + ": spawn is not navigable");
  for (const p of route)
    assert(
      !g
        .worldSolids(zone)
        .some(
          (r) =>
            p.x > r.x - 12 &&
            p.x < r.x + r.w + 12 &&
            p.y > r.y - 12 &&
            p.y < r.y + r.h + 12,
        ),
      zone + ": path crosses obstacle",
    );
}

g.state.zone = "MALL";
Object.assign(g.state.player, g.MAPS.MALL.spawn);
g.resetTrail();
g.update(0);
g.draw();
await writeFile(".tmp/exploration.png", canvas.toBuffer("image/png"));
for (const key of [
  "m",
  "tab",
  "tab",
  "m",
  "p",
  "escape",
  "b",
  "escape",
  "i",
  "escape",
  "q",
  "escape",
  "escape",
  "escape",
]) {
  g.input(key);
  g.draw();
}
g.setModal(null);
g.setOverlay("map");
g.draw();
await writeFile(".tmp/atlas.png", canvas.toBuffer("image/png"));
g.setOverlay(null);
const x = g.state.player.x;
for (const fn of window.listeners.keydown)
  fn({ key: "d", preventDefault() {} });
g.update(0.1);
for (const fn of window.listeners.keyup) fn({ key: "d" });
assert(g.state.player.x > x, "keyboard movement is disconnected");

g.startBattle(
  [
    { type: "PROTESTER", level: 1 },
    { type: "TEACHER", level: 1 },
  ],
  { gold: 50, xp: 120 },
);
g.setAutoMode(1);
for (let i = 0; i < 6000 && g.getBattle()?.phase !== "victory"; i++) {
  g.update(1 / 30);
  if (i % 60 === 0) g.draw();
}
assert.equal(g.getBattle()?.phase, "victory", "auto battle did not finish");
assert(g.state.party.every((p) => p.lvl === 2));
const awarded = g.state.expedition.totalXP;
g.winBattle();
assert.equal(g.state.expedition.totalXP, awarded, "duplicate victory rewards");
g.draw();
await writeFile(".tmp/victory.png", canvas.toBuffer("image/png"));
g.finishBattle(true, false);
assert.equal(g.mode, "world");
const p = g.state.party[0],
  atk = p.atk;
g.buyTalent(p, { id: "power", name: "Power", max: 7 });
assert.equal(p.atk, atk + 4);
assert.equal(p.points, 0);
g.saveGame(false);
const saved = plain(g.state);
g.state.cash = 0;
g.loadGame(false);
assert.equal(g.state.cash, saved.cash);
assert.deepEqual(plain(g.state.party), saved.party);
const reloaded = await loadGame({ storage });
reloaded.game.loadGame(false);
assert.equal(reloaded.game.mode, "world");
assert.equal(reloaded.game.state.cash, saved.cash);

// Legacy fields are normalized without losing the user's established save slot.
const legacy = plain(g.state);
delete legacy.expedition;
delete legacy.settings.autoMode;
legacy.party.forEach((p) => {
  delete p.talents;
  delete p.points;
});
const migrated = g.freshState();
g.mergeState(migrated, legacy);
assert.equal(migrated.settings.autoMode, 0);
assert(migrated.party.every((p) => p.talents && Number.isFinite(p.points)));
g.startBattle(
  [
    { type: "PROTESTER", level: 4 },
    { type: "TEACHER", level: 4 },
    { type: "VETERAN", level: 4 },
  ],
  { gold: 99 },
);
g.setAutoMode(0);
g.getBattle().phase = "input";
g.draw();
await writeFile(".tmp/battle.png", canvas.toBuffer("image/png"));
g.retreat();
assert.equal(g.mode, "world");
assert.equal(g.getBattle(), null);
g.beginTrial(0);
assert.equal(g.getBattle().reward.trial, 0);
g.retreat();
console.log(
  "Gameplay: 12 districts, navigation, keyboard input, overlays, auto victory, rewards, talents, saves, migration, retreat and trials passed.",
);
