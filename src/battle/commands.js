function chooseItem(key) {
  const item = ITEMS[key];
  battle.pending = {
    kind: "item",
    item: key,
    targetType: "ally",
  };
  battle.targetIndex = 0;
  battle.phase = "target";
}

function battleItems() {
  return Object.entries(state.inventory).filter(([k, v]) => v > 0 && ITEMS[k]);
}

function commitBattleMenu() {
  const p = currentActor();
  if (!p || !p.alive) {
    advancePlayer();
    return;
  }
  sfx("confirm");
  if (battle.menuIndex === 0) {
    battle.pending = {
      kind: "basic",
      targetType: "enemy",
      pose: BASIC_POSE[p.name] ?? 0,
    };
    battle.targetIndex = 0;
    battle.phase = "target";
  } else if (battle.menuIndex === 1) {
    battle.subIndex = 0;
    battle.phase = "skills";
  } else if (battle.menuIndex === 2) {
    if (!battleItems().length) {
      battle.message = "NO ITEMS AVAILABLE.";
      battle.phase = "message";
      battle.pending = null;
      sfx("error");
    } else {
      battle.subIndex = 0;
      battle.phase = "items";
    }
  } else if (battle.menuIndex === 3) {
    beginPlayerAction({
      kind: "guard",
      actor: p,
      pose: 1,
    });
  } else if (battle.menuIndex === 4) {
    battle.targetIndex = 0;
    battle.phase = "analyze";
  } else if (battle.menuIndex === 5) {
    if (battle.reward.boss) {
      battle.message = "YOU CANNOT RUN FROM A BOSS ENCOUNTER.";
      battle.phase = "message";
      sfx("error");
    } else if (Math.random() < 0.72) {
      battle.message = "THE PARTY DISENGAGED.";
      battle.phase = "victory";
      setTimeout(() => finishBattle(false, true), 550);
    } else {
      battle.message = "COULD NOT ESCAPE.";
      battle.phase = "message";
      battle.pending = {
        failedRun: true,
      };
    }
  }
}

function selectSkill(skill) {
  const p = currentActor();
  if (!skill.limit && p.mp < skill.cost) {
    battle.message = "NOT ENOUGH MP.";
    battle.phase = "message";
    battle.pending = null;
    sfx("error");
    return;
  }
  battle.pending = {
    kind: "skill",
    skill,
    targetType:
      skill.target === "enemy"
        ? "enemy"
        : skill.target === "ally"
          ? "ally"
          : null,
  };
  if (skill.target === "enemy" || skill.target === "ally") {
    battle.targetIndex = 0;
    battle.phase = "target";
  } else
    beginPlayerAction({
      kind: "skill",
      actor: p,
      skill,
      targets:
        skill.target === "enemies"
          ? aliveEnemies()
          : skill.target === "allies"
            ? aliveParty()
            : [p],
      pose: skill.pose,
    });
}

function confirmBattleTarget(target) {
  const p = currentActor(),
    pd = battle.pending;
  if (!pd) return;
  if (pd.kind === "basic")
    beginPlayerAction({
      kind: "basic",
      actor: p,
      target,
      pose: pd.pose ?? BASIC_POSE[p.name] ?? 0,
    });
  else if (pd.kind === "skill")
    beginPlayerAction({
      kind: "skill",
      actor: p,
      skill: pd.skill,
      targets: [target],
      pose: pd.skill.pose,
    });
  else if (pd.kind === "item")
    beginPlayerAction({
      kind: "item",
      actor: p,
      target,
      item: pd.item,
      pose: BATTLE_IDLE_POSE[p.name] ?? 0,
    });
}

function skillsFor(p) {
  const list = PARTY_DEFS[p.name].skills
    .filter((s, i) => p.lvl >= SKILL_LEVELS[i])
    .map((s) => ({
      ...s,
      limit: false,
    }));
  if (p.limit >= 100)
    list.push({
      ...PARTY_DEFS[p.name].limit,
      cost: 0,
      limit: true,
    });
  return list;
}

function chooseSkill(s) {
  if (!s) return;
  if (s.kind === "revive" && !state.party.some((p) => !p.alive)) {
    notify("ALL HEROES ARE ALIVE");
    return;
  }
  selectSkill(s);
}

function battleTargets() {
  if (battle.pending?.targetType === "enemy") return aliveEnemies();
  if (battle.pending?.skill?.kind === "revive")
    return state.party.filter((p) => !p.alive);
  if (battle.pending?.kind === "item" && ITEMS[battle.pending.item]?.revive)
    return state.party;
  return aliveParty();
}
