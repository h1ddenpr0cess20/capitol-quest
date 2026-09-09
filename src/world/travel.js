function transitionToZone(zone, spawn = null) {
  transition = {
    alpha: 0,
    dir: 1,
    callback: () => {
      state.zone = zone;
      const s = spawn || MAPS[zone].spawn;
      state.player.x = s.x;
      state.player.y = s.y;
      state.player.dir = "down";
      recoverPlayerPosition();
      resetTrail();
      encounterGrace = 2;
      worldMobMotion = {};
      updateCamera();
      notify(MAPS[zone].name);
      saveGame(false);
    },
  };
}

function transitionWithDiscovery(zone, spawn) {
  adv().visited[zone] = true;
  transitionToZone(zone, spawn);
}

function departure(z, target, x, y) {
  return {
    id: "travel_" + target,
    x,
    y,
    label: MAPS[target].name,
    travel: target,
    run: () => {
      if (!isZoneUnlocked(target)) {
        notify("UNLOCKS AT STORY STAGE " + (SIDE_MISSIONS[target]?.stage || 7));
        return;
      }
      zoneTransition(target);
    },
  };
}

function nextDistrict(from, to) {
  const q = [[from]],
    seen = new Set([from]);
  while (q.length) {
    const path = q.shift(),
      last = path.at(-1);
    if (last === to) return path[1];
    for (const link of LINKS)
      if (link.includes(last)) {
        const n = link.find((x) => x !== last);
        if (!seen.has(n)) {
          seen.add(n);
          q.push([...path, n]);
        }
      }
  }
  return null;
}

function localObjective() {
  const ob = getObjective();
  if (!ob) return null;
  if (ob.zone === state.zone) return ob;
  const next = nextDistrict(state.zone, ob.zone);
  return interactables().find((i) => i.travel === next) || null;
}

function isZoneUnlocked(z) {
  if (SIDE_MISSIONS[z]) return state.mainStage >= SIDE_MISSIONS[z].stage;
  return state.mainStage >= [0, 0, 3, 4, 5, 7][CORE_ZONES.indexOf(z)];
}

function zoneTransition(z, spawn) {
  walkPath = [];
  if (!MAPS[z]) return;
  transitionWithDiscovery(z, spawn || MAPS[z].spawn);
}

function getObjective() {
  const z = state.zone,
    side = SIDE_MISSIONS[z];
  if (side && !sideState(z).complete) {
    const s = sideState(z),
      n = [0, 1, 2].find((i) => !s.nodes.includes(i)),
      pos =
        n === undefined
          ? [960, 390]
          : [
              [300, 490],
              [960, 600],
              [1610, 490],
            ][n];
    return {
      zone: z,
      x: pos[0],
      y: pos[1],
      label:
        n === undefined
          ? "Challenge " + ENEMY_DEFS[side.boss].label
          : side.verb + " (" + s.nodes.length + "/3)",
    };
  }
  let target;
  switch (state.mainStage) {
    case 0:
      target = ["MALL", "protester", "Speak to the rally witness"];
      break;
    case 1:
      target = [
        "MALL",
        state.flags.veteranClue ? "teacher" : "veteran",
        "Interview both service-route witnesses",
      ];
      break;
    case 2: {
      const i = [0, 1, 2].find((i) => !adv().breakers.includes(i));
      target = [
        "GROUNDS",
        i === undefined ? "megaphone" : "breaker" + i,
        i === undefined
          ? "Recover the relay key"
          : "Restore relay switches (" + adv().breakers.length + "/3)",
      ];
      break;
    }
    case 3:
      target = ["ROTUNDA", "sentinel", "Clear the Sentinel checkpoint"];
      break;
    case 4: {
      const i = [0, 1, 2].find((i) => !adv().catalog.includes(i));
      target = [
        "ARCHIVE",
        i === undefined ? "ledger" : "catalog" + i,
        i === undefined
          ? "Unlock the ledger vault"
          : "Find catalog cards (" + adv().catalog.length + "/3)",
      ];
      break;
    }
    case 5:
      target = [
        "PRESS",
        !adv().channelOpen
          ? "channel"
          : !state.flags.fixer
            ? "fixer"
            : "transcript",
        !adv().channelOpen
          ? "Tune the relay · 2 / 4 / 1"
          : !state.flags.fixer
            ? "Defeat the Media Fixer"
            : "Recover the source transcript",
      ];
      break;
    case 6:
      target = [
        "PRESS",
        "factchecker",
        "Verify both originals with the Fact Checker",
      ];
      break;
    case 7: {
      const i = [0, 1].find((i) => !adv().briefs.includes(i));
      target = [
        "HEARING",
        i === undefined ? "chair" : "brief" + i,
        i === undefined
          ? "Challenge the Committee Chair"
          : "File both evidence packages",
      ];
      break;
    }
    case 8:
      target = ["HEARING", "record", "Choose the future of the public record"];
      break;
    default:
      return {
        zone: "HEARING",
        x: 260,
        y: 370,
        label: "Explore the Federal Vault and finish side missions",
      };
  }
  const p = LOCATIONS[target[0]][target[1]];
  return {
    zone: target[0],
    x: p[0],
    y: p[1],
    label: target[2],
  };
}
