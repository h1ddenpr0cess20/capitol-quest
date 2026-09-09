function initializeBattle(specs, reward = {}) {
  if (mode === "battle") return;
  const clean = specs.filter(Boolean).slice(0, 3);
  battle = {
    enemies: clean.map(makeEnemy),
    reward,
    round: 1,
    actorIndex: 0,
    phase: "intro",
    menuIndex: 0,
    subIndex: 0,
    targetIndex: 0,
    pending: null,
    action: null,
    enemyQueue: [],
    enemyIndex: 0,
    message: `${reward.label || "ENCOUNTER"} — ${clean.map((s) => ENEMY_DEFS[s.type].label).join(" + ")}`,
    timer: 0.55,
    log: [],
  };
  state.party.forEach((p) => {
    p.alive = p.hp > 0;
    p.guard = false;
    p.status = {};
  });
  battle.actorIndex = Math.max(
    0,
    state.party.findIndex((p) => p.alive),
  );
  mode = "battle";
  particles = [];
  spriteFx = [];
  floaters = [];
  screenShake = 0;
  sfx("confirm");
}

function aliveParty() {
  return state.party.filter((p) => p.alive && p.hp > 0);
}

function aliveEnemies() {
  return battle.enemies.filter((e) => e.hp > 0);
}

function currentActor() {
  return state.party[battle.actorIndex];
}

function finishStoryBattle(won, escaped) {
  if (!battle) return;
  const reward = battle.reward || {};
  if (won) {
    state.party.forEach((p) => {
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.12));
      p.mp = Math.min(p.maxMp, p.mp + Math.round(p.maxMp * 0.1));
      p.alive = p.hp > 0;
      p.status = {};
    });
  }
  battle = null;
  updateCamera();
  if (won && reward.boss && BOSS_SCENES[reward.boss]) {
    encounterGrace = 2;
    saveGame(false);
    startStoryScene(BOSS_SCENES[reward.boss]);
    return;
  }
  mode = "world";
  state.party.forEach((p) => {
    p.status = {};
    p.guard = false;
  });
  if (escaped) encounterGrace = 3;
  else encounterGrace = 1.2;
  saveGame(false);
  if (escaped) notify("ESCAPED SAFELY");
}

function startBattleWithIntents(specs, reward = {}) {
  initializeBattle(specs, reward);
  if (!battle) return;
  refreshIntents();
  battle.message = reward.practice
    ? "PRACTICE · Hit a weakness twice to BREAK an enemy. Defend against charged attacks."
    : `${reward.label || "ENCOUNTER"} · Read enemy intentions before choosing.`;
  battle.autoTimer = 0;
}

function loseBattle() {
  if (!battle) return;
  battle.phase = "defeat";
  battle.message =
    "FALL BACK · Retry this encounter or recover at the nearest rest point.";
}

function finishBattleWithRecovery(won, escaped) {
  if (battle?.reward.practice) {
    state.party.forEach((p, i) => {
      const old = battle.practiceParty?.[i];
      if (old) Object.assign(p, old);
    });
    if (battle.practiceInventory)
      state.inventory = {
        ...battle.practiceInventory,
      };
  }
  finishStoryBattle(won, escaped);
}

function startBattleWithRecovery(specs, reward = {}) {
  const party = JSON.parse(JSON.stringify(state.party)),
    inventory = {
      ...state.inventory,
    };
  startBattleWithIntents(specs, reward);
  if (reward.practice) {
    battle.practiceParty = party;
    battle.practiceInventory = inventory;
  }
}

function partyPos(p) {
  return (
    [
      {
        x: 174,
        y: 292,
      },
      {
        x: 122,
        y: 420,
      },
      {
        x: 336,
        y: 360,
      },
      {
        x: 505,
        y: 430,
      },
    ][state.party.indexOf(p)] || {
      x: 174,
      y: 292,
    }
  );
}

function enemyPos(e) {
  const n = battle.enemies.length,
    i = battle.enemies.indexOf(e);
  return (
    (n === 1
      ? [
          {
            x: 985,
            y: 374,
          },
        ]
      : n === 2
        ? [
            {
              x: 875,
              y: 330,
            },
            {
              x: 1110,
              y: 397,
            },
          ]
        : [
            {
              x: 815,
              y: 335,
            },
            {
              x: 1000,
              y: 401,
            },
            {
              x: 1150,
              y: 285,
            },
          ])[i] || {
      x: 985,
      y: 374,
    }
  );
}

function startBattle(specs, reward = {}) {
  if (mode === "battle") return;
  walkPath = [];
  walkTarget = null;
  const levels = {
    SENTINEL: 4,
    FIXER: 7,
    CHAIR: 9,
  };
  specs = specs.map((s) => ({
    ...s,
    level:
      reward.mission || reward.trial !== undefined
        ? s.level
        : levels[s.type] || s.level,
  }));
  startBattleWithRecovery(specs, reward);
  battle.autoClock = 0;
  battle.resultClock = 0;
  battle.breaks = 0;
  battle.specs = specs.map((s) => ({
    ...s,
  }));
  if (sideState("RECORDS").complete)
    state.party.forEach((p) => (p.limit = Math.min(100, p.limit + 15)));
}

function winBattle() {
  if (!battle || battle.phase === "victory") return;
  const r = battle.reward,
    practice = !!r.practice,
    multi = r.mission === "VAULT" && r.wave < 2;
  const level = Math.max(...battle.enemies.map((e) => e.level));
  const xp = practice
      ? 0
      : multi
        ? 100
        : (r.xp ??
          (r.boss
            ? 140 + level * 24
            : 50 + level * 18 + battle.enemies.length * 10)),
    gold = practice ? 0 : multi ? 0 : (r.gold ?? 50);
  state.cash += gold;
  const gains = practice ? [] : grantPartyXP(xp);
  if (!practice) {
    adv().battles++;
    state.party.forEach((p) => (p.limit = Math.min(100, p.limit + 18)));
  }
  if (r.worldMob) state.defeated[r.worldMob] = true;
  let relic = null;
  if (r.mission && !multi && !sideState(r.mission).complete) {
    sideState(r.mission).complete = true;
    relic = SIDE_MISSIONS[r.mission].relic;
    if (r.mission === "VAULT") state.party.forEach((p) => (p.points += 2));
    log("Mission complete: " + SIDE_MISSIONS[r.mission].title + " · " + relic);
  }
  if (r.trial !== undefined) {
    const prev = state.expedition.trials[r.trial];
    const stars =
      battle.round <= 4 && aliveParty().length === 4
        ? 3
        : aliveParty().length === 4
          ? 2
          : 1;
    state.expedition.trials[r.trial] = Math.max(prev || 0, stars);
  }
  if (r.boss === "SENTINEL" && !r.mission && r.trial === undefined) {
    state.flags.sentinel = true;
    setStage(4);
  }
  if (r.boss === "FIXER" && !r.mission && r.trial === undefined)
    state.flags.fixer = true;
  if (r.boss === "CHAIR") {
    state.flags.chair = true;
    setStage(8);
  }
  battle.phase = "victory";
  battle.result = {
    xp,
    gold,
    gains,
    relic,
    multi,
    rounds: battle.round,
    breaks: battle.breaks,
  };
  battle.resultClock = 0;
  battle.message = practice
    ? "PRACTICE CLEARED"
    : multi
      ? "SECURITY WAVE CLEARED"
      : "VICTORY · +" + xp + " XP · +" + gold + " CASH";
  if (!practice) saveGame(false);
  sfx("victory");
}

function finishBattle(won, escaped) {
  if (!battle) return;
  const r = {
    ...battle.reward,
  };
  if (won && r.mission === "VAULT" && r.wave < 2) {
    state.party.forEach((p) => {
      p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.18));
      p.mp = Math.min(p.maxMp, p.mp + Math.round(p.maxMp * 0.15));
      p.alive = p.hp > 0;
      p.status = {};
    });
    battle = null;
    mode = "world";
    startBattle(
      [
        {
          type: r.wave === 0 ? "FIXER" : "CUSTODIAN",
          level: DISTRICTS.VAULT.level,
        },
      ],
      {
        ...r,
        wave: r.wave + 1,
      },
    );
    return;
  }
  const practice = battle.reward.practice;
  if (practice) {
    const saved = battle.practiceParty,
      inv = battle.practiceInventory;
    battle = null;
    mode = "world";
    state.party = JSON.parse(JSON.stringify(saved));
    state.inventory = {
      ...inv,
    };
    encounterGrace = 3;
    saveGame(false);
    return;
  }
  if (won && sideState("GARDEN").complete)
    state.party.forEach(
      (p) => (p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.06))),
    );
  finishBattleWithRecovery(won, escaped);
}

function retreat() {
  if (battle?.reward.practice) {
    finishBattle(false, true);
    return;
  }
  restoreParty();
  battle = null;
  mode = "world";
  state.player = {
    ...state.player,
    x: REST[state.zone].x,
    y: REST[state.zone].y + 50,
  };
  walkPath = [];
  recoverPlayerPosition();
  resetTrail();
  encounterGrace = 3;
  saveGame(false);
}

function retryBattle() {
  const specs = battle.specs.map((s) => ({
      ...s,
    })),
    reward = {
      ...battle.reward,
    };
  if (reward.practice) {
    finishBattle(false, true);
    startBattle(specs, reward);
    return;
  }
  restoreParty();
  battle = null;
  mode = "world";
  startBattle(specs, reward);
}
