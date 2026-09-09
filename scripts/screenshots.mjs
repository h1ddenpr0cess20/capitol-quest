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
