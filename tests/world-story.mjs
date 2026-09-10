import assert from "node:assert/strict";
import { loadGame } from "./harness.mjs";
const { game: g } = await loadGame();
g.startNewGame();
for (let i = 0; i < 4; i++) g.input("enter");
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const blocked = (zone, p, r = 18) =>
  g
    .worldSolids(zone)
    .some(
      (s) =>
        p.x > s.x - r &&
        p.x < s.x + s.w + r &&
        p.y > s.y - r &&
        p.y < s.y + s.h + r,
    );
let routes = 0;
function reachable(zone, from, target) {
  if (distance(from, target) < 80) return;
  const path = g.findPath(from, target, zone);
  assert(
    path.length,
    `${zone}: no route to ${target.id || "objective"} (${target.x},${target.y})`,
  );
  assert(
    distance(path.at(-1), target) < 84,
    `${zone}: interaction out of reach`,
  );
  let prev = from;
  for (const p of path) {
    const steps = Math.ceil(distance(prev, p) / 4);
    for (let i = 1; i <= steps; i++)
      assert(
        !blocked(zone, {
          x: prev.x + ((p.x - prev.x) * i) / steps,
          y: prev.y + ((p.y - prev.y) * i) / steps,
        }),
        `${zone}: path clips obstacle`,
      );
    prev = p;
  }
  routes++;
}
for (const zone of Object.keys(g.DISTRICTS)) {
  g.state.zone = zone;
  const spawn = g.MAPS[zone].spawn;
  Object.assign(g.state.player, spawn);
  g.resetTrail();
  assert(!blocked(zone, spawn), zone + ": blocked spawn");
  for (const it of [...g.interactables(), ...g.npcList()]) {
    assert(!blocked(zone, it), zone + ": object/NPC in solid " + it.id);
    reachable(zone, spawn, it);
  }
  for (const mob of g.WORLD_ENCOUNTERS[zone])
    assert(!blocked(zone, mob), zone + ": encounter inside scenery");
  if (g.SIDE_MISSIONS[zone]) {
    const ms = g.sideState(zone);
    ms.nodes = [];
    let from = spawn;
    for (let i = 0; i < 3; i++) {
      const target = g.interactables().find((t) => t.id === "mission_" + i),
        ob = g.getObjective();
      assert.equal(
        distance(target, ob),
        0,
        zone + ": objective disagrees with mission item",
      );
      reachable(zone, from, target);
      target.run();
      from = target;
    }
    const boss = g.interactables().find((t) => t.id === "mission_boss");
    assert.equal(distance(boss, g.getObjective()), 0);
    reachable(zone, from, boss);
    reachable(
      zone,
      boss,
      g.interactables().find((t) => t.travel),
    );
  }
}
// Old saves may land inside new geometry. Loading recovers without losing progress.
g.state.zone = "PRESS";
Object.assign(g.state.player, { x: 410, y: 330 });
g.state.cash = 321;
g.saveGame(false);
g.loadGame(false);
assert(!blocked("PRESS", g.state.player));
assert.equal(g.state.cash, 321);
// Follow the actual dialogue callbacks and story gates in their intended order.
g.startNewGame();
for (let i = 0; i < 4; i++) g.input("enter");
function talk(id) {
  const n = g.npcList().find((n) => n.id === id);
  assert(n);
  g.startDialogue(n);
  let guard = 0;
  while (g.mode === "dialogue" && guard++ < 12) {
    g.draw();
    g.input("enter");
  }
  assert(guard < 12);
}
function visit(zone) {
  g.state.zone = zone;
  Object.assign(g.state.player, g.MAPS[zone].spawn);
  g.resetTrail();
}
function use(id) {
  const it = g.interactables().find((i) => i.id === id);
  assert(it, id);
  reachable(g.state.zone, g.state.player, it);
  it.run();
}
function win() {
  g.winBattle();
  g.finishBattle(true, false);
  let n = 0;
  while (g.mode === "cutscene" && n++ < 10) {
    g.draw();
    g.input("enter");
  }
}
talk("protester");
assert.equal(g.state.mainStage, 1);
talk("veteran");
talk("teacher");
assert.equal(g.state.mainStage, 2);
visit("GROUNDS");
for (let i = 0; i < 3; i++) use("breaker" + i);
use("megaphone");
assert.equal(g.state.mainStage, 3);
visit("ROTUNDA");
use("sentinel");
win();
assert.equal(g.state.mainStage, 4);
visit("ARCHIVE");
for (let i = 0; i < 3; i++) use("catalog" + i);
use("ledger");
// Enter the real archive combination, then collect the ledger.
for (const k of ["1", "2", "3"]) g.input(k);
assert(g.state.adventure.archiveOpen, "archive puzzle did not unlock");
use("ledger");
assert.equal(g.state.mainStage, 5);
visit("PRESS");
use("channel");
for (const k of [
  "arrowup",
  "arrowup",
  "arrowright",
  "arrowdown",
  "arrowright",
  "arrowup",
  "enter",
])
  g.input(k);
assert(g.state.adventure.channelOpen, "channel puzzle did not unlock");
use("fixer");
win();
use("transcript");
talk("factchecker");
assert.equal(g.state.mainStage, 7);
visit("HEARING");
use("brief0");
use("brief1");
use("chair");
win();
assert.equal(g.state.mainStage, 8);
use("record");
assert.equal(g.mode, "ending");
g.input("enter");
const rollback = g.endingPages().join(" ");
for (let i = 0; i < 4; i++) g.input("enter");
assert.equal(g.mode, "world");
assert.equal(g.state.mainStage, 9);
g.state.endingChoice = 1;
assert.notEqual(g.endingPages().join(" "), rollback);
assert(g.endingPages().join(" ").includes("VICTORY PLUS"));
// Gun animation stays planted and uses the same pose transform as its tracer.
g.startBattle([{ type: "PROTESTER", level: 1 }], { gold: 0 });
const b = g.getBattle(),
  p = g.state.party[1],
  pos = g.partyPos(p);
b.phase = "action";
b.action = {
  kind: "basic",
  actor: p,
  target: b.enemies[0],
  pose: 2,
  duration: 0.82,
  t: 0,
};
for (const t of [0, 0.12, 0.22, 0.3, 0.37, 0.45, 0.7]) {
  b.action.t = t;
  const pose = g.battlePartyPose(p);
  assert.equal(pose.y, pos.y);
  assert(pose.x <= pos.x && pose.x >= pos.x - 3.01);
  assert.equal(pose.firing, t >= 0.21 && t < 0.38);
  if (pose.firing) {
    assert.equal(pose.meta, g.ACT.action.HEGSETH[2]);
    assert(pose.muzzle.x > pose.x + 65 && pose.muzzle.x < pose.x + 85);
  }
  g.draw();
}
b.action = {
  kind: "skill",
  actor: p,
  skill: p.skills?.[1] || { kind: "buffDef" },
  pose: 1,
  duration: 0.82,
  t: 0.3,
};
assert.equal(g.battlePartyPose(p).firing, false);
console.log(
  `World/story: ${routes} swept collision routes; all 12 districts, side-objective chains, old-save recovery, main story gates, endings and Hegseth firing checked.`,
);
