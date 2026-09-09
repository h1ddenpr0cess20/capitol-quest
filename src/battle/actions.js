function beginPlayerAction(a) {
  if (a.skill) {
    if (a.skill.limit) a.actor.limit = 0;
    else a.actor.mp -= a.skill.cost;
  }
  battle.message =
    a.kind === "basic"
      ? `${a.actor.label}: ${BASIC_NAMES[a.actor.name]}`
      : a.kind === "skill"
        ? `${a.actor.label}: ${a.skill.name}`
        : a.kind === "guard"
          ? `${a.actor.label}: Defend`
          : `${a.actor.label}: ${ITEMS[a.item].name}`;
  battle.action = {
    ...a,
    t: 0,
    applied: false,
    duration: 0.82,
  };
  battle.phase = "action";
  battle.pending = null;
  sfx("confirm");
}

function resolveCorePlayerAction(a) {
  const p = a.actor;
  if (a.kind === "guard") {
    p.guard = true;
    addStatus(p, "defUp", 2);
    battle.message = `${p.label} braces for impact.`;
    addFx("buff", partyPos(p).x, partyPos(p).y - 70);
    return endPlayerAction();
  }
  if (a.kind === "item") {
    if (!state.inventory[a.item]) {
      battle.message = "THE ITEM IS NO LONGER AVAILABLE.";
      return endPlayerAction();
    }
    state.inventory[a.item]--;
    const it = ITEMS[a.item],
      t = a.target;
    if (it.heal) {
      const before = t.hp;
      t.hp = Math.min(t.maxHp, t.hp + it.heal);
      t.alive = t.hp > 0;
      addFloater(t, `+${t.hp - before}`, "#7dff9f");
    } else if (it.mp) {
      const before = t.mp;
      t.mp = Math.min(t.maxMp, t.mp + it.mp);
      addFloater(t, `+${t.mp - before} MP`, "#76ddff");
    }
    p.limit = Math.min(100, p.limit + 8);
    battle.message = `${p.label} used ${it.name} on ${t.label}.`;
    addFx("heal", partyPos(t).x, partyPos(t).y - 65);
    sfx("heal");
    return endPlayerAction();
  }
  if (a.kind === "basic") {
    const res =
      p.name === "RFK"
        ? damageMagic(p, a.target, 1)
        : p.name === "LUTNICK"
          ? damageHybrid(p, a.target, 1)
          : damagePhysical(p, a.target, 1, 0);
    applyDamage(a.target, res);
    p.limit = Math.min(100, p.limit + 10);
    battle.message = `${p.label} attacks ${a.target.name}${res.crit ? " — CRITICAL" : ""}.`;
    addFx(
      p.name === "HEGSETH"
        ? "gun"
        : p.name === "LUTNICK"
          ? "money"
          : p.name === "RFK"
            ? "magic"
            : "hit",
      enemyPos(a.target).x,
      enemyPos(a.target).y - 70,
    );
    return endPlayerAction();
  }
  const s = a.skill,
    targets = a.targets || [];
  let msg = `${p.label} used ${s.name}.`;
  if (s.kind === "physical" || s.kind === "magic" || s.kind === "hybrid") {
    const t = targets[0];
    const res =
      s.kind === "physical"
        ? damagePhysical(p, t, s.power, s.crit || 0)
        : s.kind === "magic"
          ? damageMagic(p, t, s.power)
          : damageHybrid(p, t, s.power);
    applyDamage(t, res);
    addFx(
      s.kind === "physical"
        ? p.name === "HEGSETH"
          ? "gun"
          : p.name === "LUTNICK"
            ? "money"
            : "hit"
        : p.name === "LUTNICK"
          ? "money"
          : "magic",
      enemyPos(t).x,
      enemyPos(t).y - 70,
    );
    p.limit = Math.min(100, p.limit + 10);
  } else if (["physicalAll", "magicAll", "hybridAll"].includes(s.kind)) {
    for (const t of targets) {
      const res =
        s.kind === "physicalAll"
          ? damagePhysical(p, t, s.power, s.crit || 0)
          : s.kind === "magicAll"
            ? damageMagic(p, t, s.power)
            : damageHybrid(p, t, s.power);
      applyDamage(t, res);
      if (s.name === "Money Rain" && Math.random() < 0.45)
        addStatus(t, "defDown", 3);
    }
    addFx(
      p.name === "LUTNICK"
        ? "money"
        : s.kind === "physicalAll"
          ? "hit"
          : "magic",
      900,
      315,
    );
    p.limit = Math.min(100, p.limit + 10);
  } else if (s.kind === "buffAtk") {
    for (const t of targets) addStatus(t, "atkUp", 3);
    addFx("buff", 420, 365);
  } else if (s.kind === "buffDef") {
    addStatus(p, "defUp", 3);
    p.guard = true;
    addFx("buff", partyPos(p).x, partyPos(p).y - 70);
  } else if (s.kind === "buffMag") {
    for (const t of targets) {
      addStatus(t, "magUp", 3);
      addStatus(t, "mpRegen", 3);
      t.mp = Math.min(t.maxMp, t.mp + 6);
    }
    addFx("buff", 420, 365);
  } else if (s.kind === "heal" || s.kind === "healRegen") {
    const t = targets[0],
      amt = Math.round(8 + effective(p, "mag") * s.power),
      before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + amt);
    t.alive = true;
    if (s.kind === "healRegen") addStatus(t, "regen", 3);
    if (s.name === "Golden Gut") delete t.status.atkDown;
    addFloater(t, `+${t.hp - before}`, "#7dff9f");
    addFx("heal", partyPos(t).x, partyPos(t).y - 70);
    sfx("heal");
  } else if (s.kind === "healAll" || s.kind === "healAllCleanse") {
    const amt = Math.round(6 + effective(p, "mag") * s.power);
    for (const t of targets) {
      const before = t.hp;
      t.hp = Math.min(t.maxHp, t.hp + amt);
      t.alive = t.hp > 0;
      if (s.kind === "healAllCleanse") removeDebuffs(t);
      addFloater(t, `+${t.hp - before}`, "#7dff9f");
    }
    addFx("heal", 420, 365);
    sfx("heal");
  }
  battle.message = msg;
  return endPlayerAction();
}

function resolvePlayerActionWithBreaks(a) {
  const enemies = (a.target ? [a.target] : a.targets || []).filter((t) =>
    battle.enemies.includes(t),
  );
  const snapshots = enemies.map((t) => t.hp);
  resolveCorePlayerAction(a);
  enemies.forEach((e, i) => {
    if (e.hp >= snapshots[i] || e.hp <= 0) return;
    if (attackType(a) === weakness(e) && !e.resolveTurns) {
      e.breakPoints = (e.breakPoints || 0) + 1;
      addFloater(e, "WEAK", "#f8ce76");
      if (e.breakPoints >= 2) {
        e.breakPoints = 0;
        e.broken = true;
        addStatus(e, "vulnerable", 2);
        battle.message += " BREAK! Enemy loses its next action.";
        addFloater(e, "BREAK!", "#84e4fa");
      }
    }
  });
}

function resolvePlayerAction(a) {
  const p = a.actor,
    s = a.skill;
  if (s?.kind === "revive") {
    const t = a.targets[0];
    if (t && !t.alive) {
      t.hp = Math.round(t.maxHp * 0.55);
      t.alive = true;
      t.status = {};
      addFloater(t, "REVIVED", "#a5e4ba");
      sfx("heal");
    }
    endPlayerAction();
    return;
  }
  if (s && ["formation", "protect"].includes(s.kind)) {
    for (const t of a.targets) {
      addStatus(t, "defUp", 3);
      if (s.kind === "formation") addStatus(t, "atkUp", 3);
      else t.guard = true;
    }
    addFx("buff", 400, 310);
    endPlayerAction();
    return;
  }
  const before = aliveEnemies().filter((e) => e.broken).length;
  resolvePlayerActionWithBreaks(a);
  if (a.kind === "basic")
    p.mp = Math.min(
      p.maxMp,
      p.mp + 2 + (sideState("TUNNELS").complete ? 1 : 0),
    );
  if (a.kind === "guard") p.mp = Math.min(p.maxMp, p.mp + 4);
  if (s?.name === "Follow Through")
    a.targets.forEach((t) => addStatus(t, "vulnerable", 2));
  if (s?.name === "Pinning Shot")
    a.targets.forEach((t) => addStatus(t, "atkDown", 3));
  battle.breaks += Math.max(
    0,
    aliveEnemies().filter((e) => e.broken).length - before,
  );
}

function resolveEnemyAction(e) {
  if (e.broken) {
    e.broken = false;
    e.resolveTurns = 2;
    e.intent = planIntent(e);
    battle.message = e.name + " is broken and loses its action.";
    return;
  }
  const move = e.intent || planIntent(e),
    living = aliveParty();
  if (!living.length) return loseBattle();
  battle.message = e.name + ": " + move.label + ".";
  if (move.kind === "guard") {
    e.guard = true;
    addStatus(e, "defUp", 2);
    return;
  }
  if (move.kind === "heal") {
    const t = aliveEnemies().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const n = Math.min(t.maxHp - t.hp, Math.round(e.maxHp * 0.2));
    t.hp += n;
    addFloater(t, "+" + n, "#9ee6b8");
    return;
  }
  const targets = move.kind === "sweep" ? living : [choice(living)];
  for (const t of targets) {
    const magic =
      ["magic", "disrupt"].includes(move.kind) ||
      (move.kind === "sweep" &&
        ["fixer", "chair", "director", "engineer"].includes(e.ai));
    const result = magic
      ? damageMagic(e, t, move.power)
      : damagePhysical(e, t, move.power);
    applyDamage(t, result);
    if (move.kind === "disrupt") addStatus(t, "magDown", 2);
    if (move.kind === "drain")
      e.hp = Math.min(e.maxHp, e.hp + Math.round(result.amount * 0.6));
    addFx(magic ? "magic" : "hit", partyPos(t).x, partyPos(t).y - 65);
  }
  if (!aliveParty().length) loseBattle();
}
