function handleBattleCommands(k) {
  if (!battle) return;
  if (
    battle.phase === "intro" ||
    battle.phase === "action" ||
    battle.phase === "enemyAction" ||
    battle.phase === "victory" ||
    battle.phase === "defeat"
  )
    return;
  if (battle.phase === "message") {
    if (k === "enter" || k === " ") {
      battle.phase = "input";
      sfx("confirm");
    }
    return;
  }
  if (k === "escape") {
    if (["skills", "items", "target", "analyze"].includes(battle.phase)) {
      battle.phase = "input";
      battle.pending = null;
      sfx("cancel");
      return;
    }
    return;
  }
  if (battle.phase === "input") {
    if (k === "arrowleft" || k === "a") {
      battle.menuIndex = (battle.menuIndex + 5) % 6;
      sfx("move");
    } else if (k === "arrowright" || k === "d") {
      battle.menuIndex = (battle.menuIndex + 1) % 6;
      sfx("move");
    } else if (k === "arrowup" || k === "w") {
      battle.menuIndex = (battle.menuIndex + 4) % 6;
      sfx("move");
    } else if (k === "arrowdown" || k === "s") {
      battle.menuIndex = (battle.menuIndex + 2) % 6;
      sfx("move");
    } else if (k >= "1" && k <= "6") {
      battle.menuIndex = Number(k) - 1;
      commitBattleMenu();
    } else if (k === "enter" || k === " ") commitBattleMenu();
    return;
  }
  if (battle.phase === "skills") {
    const skills = skillsFor(currentActor());
    if (k === "arrowup" || k === "w" || k === "arrowleft" || k === "a") {
      battle.subIndex = (battle.subIndex + skills.length - 1) % skills.length;
      sfx("move");
    } else if (
      k === "arrowdown" ||
      k === "s" ||
      k === "arrowright" ||
      k === "d"
    ) {
      battle.subIndex = (battle.subIndex + 1) % skills.length;
      sfx("move");
    } else if (k === "enter" || k === " ") chooseSkill(skills[battle.subIndex]);
    return;
  }
  if (battle.phase === "items") {
    const items = battleItems();
    if (!items.length) {
      battle.phase = "input";
      return;
    }
    if (k === "arrowup" || k === "w") {
      battle.subIndex = (battle.subIndex + items.length - 1) % items.length;
      sfx("move");
    } else if (k === "arrowdown" || k === "s") {
      battle.subIndex = (battle.subIndex + 1) % items.length;
      sfx("move");
    } else if (k === "enter" || k === " ")
      chooseItem(items[battle.subIndex][0]);
    return;
  }
  if (battle.phase === "target") {
    const ts = battleTargets();
    if (!ts.length) return;
    if (k === "arrowleft" || k === "a" || k === "arrowup" || k === "w") {
      battle.targetIndex = (battle.targetIndex + ts.length - 1) % ts.length;
      sfx("move");
    } else if (
      k === "arrowright" ||
      k === "d" ||
      k === "arrowdown" ||
      k === "s"
    ) {
      battle.targetIndex = (battle.targetIndex + 1) % ts.length;
      sfx("move");
    } else if (k === "enter" || k === " ")
      confirmBattleTarget(ts[battle.targetIndex]);
    return;
  }
  if (battle.phase === "analyze") {
    const es = aliveEnemies();
    if (k === "arrowleft" || k === "a" || k === "arrowup" || k === "w") {
      battle.targetIndex = (battle.targetIndex + es.length - 1) % es.length;
      sfx("move");
    } else if (
      k === "arrowright" ||
      k === "d" ||
      k === "arrowdown" ||
      k === "s"
    ) {
      battle.targetIndex = (battle.targetIndex + 1) % es.length;
      sfx("move");
    } else if (k === "enter" || k === " ") {
      const e = es[battle.targetIndex];
      e.analyzed = true;
      addStatus(e, "vulnerable", 2);
      battle.message = `ANALYZED ${e.name}: ${e.trait}. Vulnerable for 2 rounds.`;
      battle.phase = "message";
      sfx("magic");
      battle.pending = {
        advanceAfterMessage: true,
      };
    }
    return;
  }
}

function handleBattlePhaseInput(k) {
  if (battle?.phase === "message" && (k === "enter" || k === " ")) {
    const pd = battle.pending;
    battle.pending = null;
    sfx("confirm");
    if (pd?.advanceAfterMessage || pd?.failedRun) {
      advancePlayer();
      return;
    }
    battle.phase = "input";
    return;
  }
  handleBattleCommands(k);
}

function handleBattleMenuInput(k) {
  if (k === "e") k = "enter";
  if (battle.phase === "victory" && (k === "enter" || k === " ")) {
    finishBattle(true, false);
    return;
  }
  if (battle.phase === "defeat") {
    if (k === "enter" || k === " ") retryBattle();
    if (k === "escape") retreat();
    return;
  }
  if (
    battle.phase === "input" &&
    (k === "6" || ((k === "enter" || k === " ") && battle.menuIndex === 5))
  ) {
    if (battle.reward.boss) {
      battle.message =
        "This checkpoint must be cleared. Defend, heal, or break the boss.";
      sfx("error");
      return;
    }
    finishBattle(false, true);
    return;
  }
  handleBattlePhaseInput(k);
}

function battleInput(k) {
  if (k === "b") {
    cycleAuto();
    return;
  }
  if (k === "v") {
    state.settings.battleSpeed = (state.settings.battleSpeed % 3) + 1;
    return;
  }
  if (k === "escape" && state.settings.autoMode) {
    setAutoMode(0);
    notify("MANUAL CONTROL");
    return;
  }
  handleBattleMenuInput(k);
}
