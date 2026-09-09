function cycleAuto() {
  state.settings.autoMode = (state.settings.autoMode + 1) % AUTO_MODES.length;
  if (
    battle &&
    ["skills", "target", "items", "analyze"].includes(battle.phase)
  ) {
    battle.phase = "input";
    battle.pending = null;
  }
  if (battle) battle.autoClock = 0;
  notify("AUTO-BATTLE · " + AUTO_MODES[state.settings.autoMode].toUpperCase());
}

function setAutoMode(n) {
  state.settings.autoMode = n;
  if (battle) {
    battle.autoClock = 0;
    if (["skills", "target", "items", "analyze"].includes(battle.phase)) {
      battle.phase = "input";
      battle.pending = null;
    }
  }
}

function chooseAutoAction() {
  const p = currentActor();
  if (!p?.alive) {
    advancePlayer();
    return;
  }
  const settings = state.settings,
    strategy = settings.autoMode,
    enemies = aliveEnemies(),
    allies = aliveParty();
  if (!enemies.length) {
    winBattle();
    return;
  }
  const affordable = skillsFor(p).filter((s) =>
      s.limit ? settings.autoLimits : s.cost <= p.mp,
    ),
    hurt = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0],
    fallen = state.party.find((t) => !t.alive),
    casts = (s, ts) =>
      beginPlayerAction({
        kind: "skill",
        actor: p,
        skill: s,
        targets: ts,
        pose: s.pose,
      });
  const revive = affordable.find((s) => s.kind === "revive");
  if (fallen && revive) {
    casts(revive, [fallen]);
    return;
  }
  if (fallen && settings.autoItems && state.inventory.MEDKIT) {
    beginPlayerAction({
      kind: "item",
      actor: p,
      item: "MEDKIT",
      target: fallen,
      pose: 0,
    });
    return;
  }
  const healing = affordable.filter((s) => /^heal/.test(s.kind));
  const low = allies.filter(
    (t) => t.hp / t.maxHp < (strategy === 2 ? 0.4 : 0.65),
  );
  if (low.length >= 2) {
    const aoe = healing.find((s) => s.kind.includes("All"));
    if (aoe) {
      casts(aoe, allies);
      return;
    }
  }
  if (hurt.hp / hurt.maxHp < (strategy === 2 ? 0.28 : 0.52)) {
    const heal = healing.find((s) => !s.kind.includes("All")) || healing[0];
    if (heal) {
      casts(heal, heal.target === "allies" ? allies : [hurt]);
      return;
    }
    if (settings.autoItems) {
      const key = state.inventory.SUPER
        ? "SUPER"
        : state.inventory.POTION
          ? "POTION"
          : state.inventory.MEDKIT
            ? "MEDKIT"
            : null;
      if (key) {
        beginPlayerAction({
          kind: "item",
          actor: p,
          item: key,
          target: hurt,
          pose: 0,
        });
        return;
      }
    }
  }
  const charging = enemies.some((e) => !e.broken && e.intent?.kind === "sweep");
  if (strategy !== 2 && charging && p.hp / p.maxHp < 0.65) {
    beginPlayerAction({
      kind: "guard",
      actor: p,
      pose: 1,
    });
    return;
  }
  const hitType =
    p.name === "RFK" ? "magic" : p.name === "LUTNICK" ? "hybrid" : "physical";
  let target = [...enemies].sort(
    (a, b) =>
      (weakness(b) === hitType ? 2 : 0) +
      (b.breakPoints || 0) * 2 +
      (1 - b.hp / b.maxHp) -
      ((weakness(a) === hitType ? 2 : 0) +
        (a.breakPoints || 0) * 2 +
        (1 - a.hp / a.maxHp)),
  )[0];
  const offensive = affordable.filter((s) =>
    /^(physical|hybrid|magic)/.test(s.kind),
  );
  const limit = offensive.find((s) => s.limit);
  if (limit) {
    casts(limit, limit.target === "enemies" ? enemies : [target]);
    return;
  }
  if (strategy !== 3) {
    if (
      battle.round === 1 &&
      enemies.some((e) => e.boss) &&
      p.name === "TRUMP" &&
      !p.status.atkUp
    ) {
      const buff = affordable.find((s) =>
        ["buffAtk", "formation"].includes(s.kind),
      );
      if (buff) {
        casts(buff, allies);
        return;
      }
    }
    const reserve = strategy === 1 ? p.maxMp * 0.18 : 0;
    const attack = offensive
      .filter((s) => p.mp - s.cost >= reserve)
      .sort((a, b) => {
        const score = (s) =>
          s.power *
          (s.target === "enemies" ? enemies.length * 0.86 : 1) *
          (weakness(target) === s.kind.replace("All", "") ? 1.16 : 1);
        return score(b) - score(a);
      })[0];
    if (attack) {
      casts(attack, attack.target === "enemies" ? enemies : [target]);
      return;
    }
  }
  beginPlayerAction({
    kind: "basic",
    actor: p,
    target,
    pose: BASIC_POSE[p.name],
  });
}
