import assert from "node:assert/strict";
import { loadGame } from "./harness.mjs";

const scenarios = [
  { name: "Mall", level: 1, types: ["PROTESTER", "EVERYDAY"] },
  { name: "Crowd", level: 1, types: ["PROTESTER", "TEACHER", "STUDENT"] },
  { name: "Garden boss", level: 2, types: ["CURATOR"], boss: true },
  { name: "Sentinel", level: 4, types: ["SENTINEL"], boss: true },
  { name: "Final story boss", level: 9, types: ["CHAIR"], boss: true },
  {
    name: "Underleveled final boss",
    level: 1,
    enemyLevel: 9,
    types: ["CHAIR"],
    boss: true,
    expectDefeat: true,
  },
];
for (const scenario of scenarios) {
  const results = [];
  for (let seed = 1; seed <= 8; seed++) {
    const { game: g } = await loadGame({ seed });
    g.setMode("world");
    while (g.state.party[0].lvl < scenario.level)
      g.grantPartyXP(g.xpRequired(g.state.party[0]));
    for (const p of g.state.party) {
      const id = ["TRUMP", "HEGSETH"].includes(p.name) ? "power" : "focus";
      while (p.points && p.talents[id] < 7)
        g.buyTalent(p, { id, name: id, max: 7 });
      while (p.points && p.talents.vitality < 7)
        g.buyTalent(p, { id: "vitality", name: "Vitality", max: 7 });
    }
    g.restoreParty();
    g.startBattle(
      scenario.types.map((type) => ({
        type,
        level: scenario.enemyLevel || scenario.level,
      })),
      {
        xp: 0,
        gold: 0,
        ...(scenario.boss ? { boss: scenario.types[0] } : {}),
      },
    );
    g.setAutoMode(1);
    let damageTaken = 0;
    for (let tick = 0; tick < 30000; tick++) {
      const b = g.getBattle();
      if (["victory", "defeat"].includes(b.phase)) break;
      const hp = g.state.party.map((p) => p.hp);
      g.update(1 / 30);
      g.state.party.forEach((p, i) => {
        damageTaken += Math.max(0, hp[i] - p.hp);
      });
    }
    const b = g.getBattle();
    results.push({
      outcome: b.phase,
      rounds: b.round,
      damageTaken,
      hp: g.state.party.reduce((n, p) => n + p.hp, 0),
    });
  }
  assert(
    results.every(
      (r) => r.outcome === (scenario.expectDefeat ? "defeat" : "victory"),
    ),
    scenario.name + ": outcome outside the intended difficulty range",
  );
  assert(
    results.every((r) => r.rounds >= 3 && r.rounds <= 20 && r.damageTaken > 0),
    scenario.name + ": fight must allow enemy turns without becoming a slog",
  );
  console.log(
    `${scenario.name}: ${results[0].outcome}, ${Math.min(...results.map((r) => r.rounds))}–${Math.max(...results.map((r) => r.rounds))} rounds across eight seeds.`,
  );
}

const { game: g } = await loadGame();
const plain = (v) => JSON.parse(JSON.stringify(v));
const old = plain(g.freshState());
delete old.expedition.balanceVersion;
old.mainStage = 4;
old.cash = 321;
Object.assign(old.party[0], {
  lvl: 3,
  xp: 75,
  points: 2,
  maxHp: 320,
  hp: 160,
  maxMp: 80,
  mp: 20,
  atk: 80,
  mag: 70,
  def: 40,
  talents: { power: 2, focus: 1, vitality: 2 },
});
old.adventure.upgrades.TRUMP = 1;
old.party[1].hp = 0;
old.party[1].alive = false;
const migrated = g.freshState();
g.mergeState(migrated, old);
assert.equal(migrated.party[0].maxHp, 120);
assert.equal(migrated.party[0].hp, 60);
assert.equal(migrated.party[0].maxMp, 33);
assert.equal(migrated.party[0].mp, 8);
assert.equal(migrated.party[0].atk, 20);
assert.equal(migrated.party[0].xp, 75);
assert.equal(migrated.party[0].points, 2);
assert.equal(migrated.party[1].hp, 0);
assert.equal(migrated.mainStage, 4);
assert.equal(migrated.cash, 321);
const again = g.freshState();
g.mergeState(again, migrated);
assert.deepEqual(
  plain(again),
  plain(migrated),
  "save migration must apply only once",
);
const p = g.state.party[0];
p.hp = 1;
p.mp = 0;
g.state.party[1].hp = 0;
g.state.party[1].alive = false;
g.grantPartyXP(g.xpRequired(p));
assert.equal(p.hp, 7, "level-up grants only newly earned HP");
assert.equal(p.mp, 2, "level-up grants only newly earned MP");
assert.equal(g.state.party[1].hp, 0, "level-up cannot revive");
assert.equal(g.skillsFor(p).filter((s) => !s.limit).length, 2);
assert.equal(g.state.party[1].alive, false);
// Victory should not erase damage; recovery is earned through supplies/rest
// or the Garden reward. Practice restores pre-fight resources.
g.setMode("world");
g.startBattle([{ type: "PROTESTER", level: 1 }], { xp: 0 });
g.winBattle();
const hp = g.state.party.map((p) => p.hp);
g.finishBattle(true, false);
assert.deepEqual(plain(g.state.party.map((p) => p.hp)), plain(hp));
g.startBattle([{ type: "PROTESTER", level: 1 }], { practice: true });
g.state.party[0].hp = 1;
g.state.party[0].mp = 0;
g.finishBattle(true, false);
assert.equal(g.state.party[0].hp, hp[0]);
console.log(
  "Balance: migration, resource preservation, level recovery and skill gating passed.",
);
