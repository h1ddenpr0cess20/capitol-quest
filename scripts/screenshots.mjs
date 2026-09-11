import { writeFile } from "node:fs/promises";
import { loadGame } from "../tests/harness.mjs";

const { game, canvas } = await loadGame();
game.startNewGame();
for (let i = 0; i < 4; i++) game.input("enter");
game.state.settings.sound = false;
game.draw();
await writeFile("screenshots/exploration.png", canvas.toBuffer("image/png"));
game.setOverlay("map");
game.draw();
await writeFile("screenshots/atlas.png", canvas.toBuffer("image/png"));
game.setOverlay(null);
game.startBattle(
  [
    { type: "PROTESTER", level: 4 },
    { type: "TEACHER", level: 4 },
    { type: "VETERAN", level: 4 },
  ],
  { gold: 99 },
);
game.getBattle().phase = "input";
game.draw();
await writeFile("screenshots/battle.png", canvas.toBuffer("image/png"));
console.log("Updated exploration, atlas and battle screenshots.");

// District contact sheet uses the exact cached world geometry, including scenery.
const { createCanvas } = await import("@napi-rs/canvas");
const contact = createCanvas(1920, 1872),
  cg = contact.getContext("2d");
cg.fillStyle = "#142b34";
cg.fillRect(0, 0, contact.width, contact.height);
let n = 0;
for (const [zone, d] of Object.entries(game.DISTRICTS)) {
  const x = (n % 3) * 640,
    y = Math.floor(n / 3) * 468;
  cg.fillStyle = "#e1d3ae";
  cg.font = "700 16px QuestMono";
  cg.fillText(d.name, x + 18, y + 24);
  cg.drawImage(game.districtScene(zone, true), x + 8, y + 36, 624, 416);
  n++;
}
await writeFile("screenshots/districts.png", contact.toBuffer("image/png"));
// Capture the firing sequence from the same pose helper used during real combat.
const p = game.state.party[1],
  b = game.getBattle(),
  pos = game.partyPos(p);
b.phase = "action";
b.action = {
  kind: "basic",
  actor: p,
  target: b.enemies[0],
  pose: 2,
  duration: 0.82,
  t: 0,
};
const cc = canvas.getContext("2d");
cc.fillStyle = "#2d444a";
cc.fillRect(0, 0, 1280, 720);
for (const [i, t] of [0, 0.14, 0.27, 0.46, 0.72].entries()) {
  b.action.t = t;
  const pose = game.battlePartyPose(p);
  game.drawActorFrame(
    pose.meta,
    100 + i * 245 + pose.x - pos.x,
    210,
    pose.scale,
  );
  cc.font = "700 16px QuestMono";
  cc.fillStyle = "#e3d4aa";
  cc.textAlign = "center";
  cc.fillText(
    ["READY", "RAISE", "FIRE", "RECOVER", "READY"][i],
    110 + i * 245,
    250,
  );
}
const strip = createCanvas(1280, 280);
strip.getContext("2d").drawImage(canvas, 0, 0);
await writeFile("screenshots/hegseth-firing.png", strip.toBuffer("image/png"));
console.log(
  "Updated twelve-district contact sheet and Hegseth firing sequence.",
);

// Include the live NPCs, patrol spawns, quest objects, and service boards.
// Static scenery alone cannot reveal overlaps introduced by those layers.
game.setMode("world");
canvas.width = 1920;
canvas.height = 1280;
n = 0;
for (const [zone, d] of Object.entries(game.DISTRICTS)) {
  game.state.zone = zone;
  Object.assign(game.state.player, { x: d.spawn[0], y: d.spawn[1] });
  game.resetTrail();
  game.draw();
  cc.clearRect(0, 0, 1920, 1280);
  cc.imageSmoothingEnabled = false;
  game.drawMapBase(zone);
  game.drawWorldEntities();
  game.drawMapObjects();
  const x = (n % 3) * 640,
    y = Math.floor(n / 3) * 468;
  cg.drawImage(canvas, x + 8, y + 36, 624, 416);
  n++;
}
await writeFile(
  "screenshots/populated-districts.png",
  contact.toBuffer("image/png"),
);
canvas.width = 1280;
canvas.height = 720;
game.state.zone = "MALL";
Object.assign(game.state.player, { x: 710, y: 1165 });
game.resetTrail();
game.draw();
await writeFile("screenshots/mall-services.png", canvas.toBuffer("image/png"));
console.log("Updated populated districts and Mall service-area review.");
