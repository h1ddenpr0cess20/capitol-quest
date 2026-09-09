function endPlayerAction() {
  if (!battle?.action) return;
  battle.action.willWin = aliveEnemies().length === 0;
  battle.action.resolved = true;
}

function advancePlayer() {
  battle.pending = null;
  let i = battle.actorIndex + 1;
  while (i < state.party.length && !state.party[i].alive) i++;
  if (i < state.party.length) {
    battle.actorIndex = i;
    battle.menuIndex = 0;
    battle.phase = "input";
    return;
  }
  startEnemyPhase();
}

function startEnemyPhase() {
  battle.enemies.forEach((e) => {
    e.guard = false;
  });
  battle.enemyQueue = aliveEnemies().slice();
  battle.enemyIndex = 0;
  battle.phase = "enemyAction";
  startEnemyAction();
}

function advanceEnemyTurn() {
  if (battle.enemyIndex >= battle.enemyQueue.length) {
    tickStatuses(state.party);
    tickStatuses(battle.enemies);
    state.party.forEach((p) => {
      p.guard = false;
    });
    battle.round++;
    battle.actorIndex = 0;
    while (
      battle.actorIndex < state.party.length &&
      !state.party[battle.actorIndex].alive
    )
      battle.actorIndex++;
    if (battle.actorIndex >= state.party.length) return loseBattle();
    battle.phase = "input";
    battle.menuIndex = 0;
    return;
  }
  const e = battle.enemyQueue[battle.enemyIndex];
  if (e.hp <= 0) {
    battle.enemyIndex++;
    return startEnemyAction();
  }
  battle.action = {
    kind: "enemy",
    actor: e,
    t: 0,
    applied: false,
    duration: 0.72,
  };
  battle.phase = "enemyAction";
}

function updateBattlePhases(dt) {
  if (!battle) return;
  if (battle.phase === "intro") {
    battle.timer -= dt;
    if (battle.timer <= 0) {
      battle.phase = "input";
      battle.actorIndex = Math.max(
        0,
        state.party.findIndex((p) => p.alive),
      );
    }
  }
  if (battle.phase === "action" && battle.action) {
    battle.action.t += dt;
    if (battle.action.t > 0.36 && !battle.action.applied) {
      battle.action.applied = true;
      resolvePlayerAction(battle.action);
    }
    if (
      battle?.phase === "action" &&
      battle.action &&
      battle.action.t >= battle.action.duration &&
      battle.action.resolved
    ) {
      const won = battle.action.willWin;
      battle.action = null;
      if (won) winBattle();
      else {
        battle.phase = "message";
        battle.pending = {
          advanceAfterMessage: true,
        };
      }
    }
  } else if (battle.phase === "enemyAction" && battle.action) {
    battle.action.t += dt;
    if (battle.action.t > 0.31 && !battle.action.applied) {
      battle.action.applied = true;
      resolveEnemyAction(battle.action.actor);
    }
    if (battle.action && battle.action.t >= battle.action.duration) {
      battle.enemyIndex++;
      battle.action = null;
      if (battle?.phase === "enemyAction") startEnemyAction();
    }
  } else if (
    battle.phase === "message" &&
    battle.pending?.advanceAfterMessage
  ) {
  }
}

function advanceEnemyRound() {
  const round = battle.round;
  advanceEnemyTurn();
  if (battle && battle.round !== round) refreshIntents();
}

function updateBattleMessages(dt) {
  updateBattlePhases(dt);
  if (battle?.phase === "message" && battle.pending?.advanceAfterMessage) {
    battle.autoTimer = (battle.autoTimer || 0) + dt;
    if (battle.autoTimer > 0.55) {
      battle.autoTimer = 0;
      advancePlayer();
    }
  } else if (battle) battle.autoTimer = 0;
}

function updateBattle(dt) {
  const speed = state.settings.battleSpeed || 1;
  updateBattleMessages(dt * speed);
  if (!battle) return;
  if (battle.phase === "input" && state.settings.autoMode) {
    battle.autoClock += dt * speed;
    if (battle.autoClock >= 0.42) {
      battle.autoClock = 0;
      chooseAutoAction();
    }
  } else battle.autoClock = 0;
  if (
    battle.phase === "message" &&
    !battle.pending?.advanceAfterMessage &&
    state.settings.autoMode
  ) {
    battle.phase = "input";
    battle.pending = null;
  }
  if (
    battle.phase === "victory" &&
    state.settings.autoContinue &&
    state.settings.autoMode &&
    !battle.result?.gains.length &&
    !battle.result?.relic &&
    !battle.reward.boss
  ) {
    battle.resultClock += dt;
    if (battle.resultClock > 1.5) finishBattle(true, false);
  }
}

function startEnemyAction() {
  const before = battle.round;
  advanceEnemyRound();
  if (battle && battle.round !== before) {
    battle.enemies.forEach((e) => {
      e.resolveTurns = Math.max(0, (e.resolveTurns || 0) - 1);
    });
    refreshIntents();
  }
}
