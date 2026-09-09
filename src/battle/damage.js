function effective(u, stat) {
  let v = u[stat];
  const st = u.status || {};
  if (stat === "atk") {
    if (st.atkUp) v *= 1.25;
    if (st.atkDown) v *= 0.76;
  }
  if (stat === "def") {
    if (st.defUp) v *= 1.3;
    if (st.defDown) v *= 0.76;
  }
  if (stat === "mag") {
    if (st.magUp) v *= 1.25;
    if (st.magDown) v *= 0.76;
  }
  return v;
}

function removeDebuffs(u) {
  for (const k of ["atkDown", "defDown", "magDown", "vulnerable"])
    delete u.status[k];
}

function damagePhysical(a, t, power = 1, critBonus = 0) {
  let base =
    effective(a, "atk") * power - effective(t, "def") * 0.52 + randInt(-2, 3);
  let crit = Math.random() < (a.luck || 8) / 250 + critBonus;
  if (t.status?.vulnerable) base *= 1.22;
  if (t.guard) base *= 0.5;
  if (crit) base *= 1.55;
  return {
    amount: Math.max(1, Math.round(base)),
    crit,
  };
}

function damageMagic(a, t, power = 1) {
  let base =
    effective(a, "mag") * power - effective(t, "def") * 0.26 + randInt(-2, 3);
  if (t.trait?.includes("Tech") && a.name === "RFK") base *= 1.2;
  if (t.status?.vulnerable) base *= 1.22;
  if (t.guard) base *= 0.62;
  return {
    amount: Math.max(1, Math.round(base)),
    crit: false,
  };
}

function damageHybrid(a, t, power = 1) {
  let base =
    (effective(a, "atk") * 0.45 + effective(a, "mag") * 0.72) * power -
    effective(t, "def") * 0.34 +
    randInt(-2, 3);
  if (t.status?.vulnerable) base *= 1.2;
  if (t.guard) base *= 0.58;
  let crit = Math.random() < (a.luck || 8) / 300;
  if (crit) base *= 1.5;
  return {
    amount: Math.max(1, Math.round(base)),
    crit,
  };
}

function dealDamage(t, res) {
  t.hp = Math.max(0, t.hp - res.amount);
  if ("alive" in t) {
    t.alive = t.hp > 0;
    t.limit = Math.min(100, t.limit + 10);
  }
  t.hitTimer = 0.28;
  addFloater(
    t,
    res.crit ? `CRIT ${res.amount}` : `${res.amount}`,
    res.crit ? "#ffe970" : "#ffffff",
  );
  screenShake = state.settings.shake ? (res.crit ? 7 : 4) : 0;
  sfx("hit");
}

function addStatus(u, key, turns) {
  u.status[key] = Math.max(u.status[key] || 0, turns);
}

function tickStatuses(units) {
  for (const u of units) {
    if (u.hp <= 0) continue;
    if (u.status.regen) {
      const amt = Math.max(2, Math.round(u.maxHp * 0.04));
      u.hp = Math.min(u.maxHp, u.hp + amt);
      addFloater(u, `+${amt}`, "#7dff9f");
    }
    if (u.status.mpRegen && u.maxMp) {
      const amt = Math.max(1, Math.round(u.maxMp * 0.04));
      u.mp = Math.min(u.maxMp, u.mp + amt);
      addFloater(u, `+${amt} MP`, "#76ddff");
    }
    for (const k of Object.keys(u.status)) {
      u.status[k]--;
      if (u.status[k] <= 0) delete u.status[k];
    }
  }
}

function weakness(e) {
  return ["Armored", "Guard", "Tech"].some((t) => e.trait.includes(t))
    ? "magic"
    : e.trait.includes("Media") || e.trait.includes("Quick")
      ? "hybrid"
      : "physical";
}

function attackType(a) {
  if (a.kind === "basic")
    return a.actor.name === "RFK"
      ? "magic"
      : a.actor.name === "LUTNICK"
        ? "hybrid"
        : "physical";
  return a.skill?.kind.replace("All", "") || "none";
}

function applyDamage(t, res) {
  if (
    battle?.action &&
    state.party.includes(battle.action.actor) &&
    battle.enemies.includes(t)
  ) {
    const kind = attackType(battle.action);
    let multiplier = kind === weakness(t) ? 1.16 : 1;
    if (kind === "magic" && sideState("ROOFTOPS").complete) multiplier *= 1.1;
    if (kind === "physical" && sideState("STATION").complete) multiplier *= 1.1;
    res = {
      ...res,
      amount: Math.round(res.amount * multiplier),
    };
  }
  dealDamage(t, res);
}
