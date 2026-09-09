// One stat formula for leveling, purchases and migration of earlier saves.
function rebuildHeroStats(p, training = 0, preserveRatio = false) {
  const d = PARTY_DEFS[p.name],
    levels = p.lvl - 1;
  const oldHp = p.maxHp,
    oldMp = p.maxMp,
    hp = p.hp,
    mp = p.mp;
  const martial = p.name === "TRUMP" || p.name === "HEGSETH";
  p.maxHp = d.maxHp + levels * 6 + p.talents.vitality * 6 + training * 8;
  p.maxMp = d.maxMp + levels * 2 + p.talents.focus * 2 + training * 3;
  p.atk = d.atk + levels + p.talents.power + training * (martial ? 2 : 1);
  p.mag = d.mag + levels + p.talents.focus + training * (martial ? 1 : 2);
  p.def = d.def + Math.floor(p.lvl / 2) + p.talents.vitality;
  p.luck = d.luck + Math.floor(levels / 3);
  p.hp =
    hp > 0
      ? clamp(
          preserveRatio
            ? Math.round((hp / oldHp) * p.maxHp)
            : hp + p.maxHp - oldHp,
          1,
          p.maxHp,
        )
      : 0;
  p.mp = clamp(
    preserveRatio ? Math.round((mp / oldMp) * p.maxMp) : mp + p.maxMp - oldMp,
    0,
    p.maxMp,
  );
  p.alive = p.hp > 0;
}

function buyUpgrade(i) {
  const p = state.party[i],
    tier = adv().upgrades[p.name] || 0,
    cost = 140 + tier * 120;
  if (tier >= 2) return notify("TRAINING COMPLETE");
  if (state.cash < cost) return notify("NEED " + cost + " CASH");
  state.cash -= cost;
  adv().upgrades[p.name] = tier + 1;
  rebuildHeroStats(p, tier + 1);
  notify(p.label + " TRAINING UPGRADED");
  saveGame(false);
}

function xpRequired(p) {
  return p.lvl >= 20 ? 0 : 120 + (p.lvl - 1) * 60;
}

function grantPartyXP(xp) {
  state.expedition.totalXP += xp;
  const gains = [];
  for (const p of state.party) {
    const before = p.lvl;
    p.xp += xp;
    levelCheck(p);
    if (p.lvl > before)
      gains.push({
        name: p.name,
        from: before,
        to: p.lvl,
      });
  }
  if (gains.length && !battle)
    notify("PARTY LEVEL UP · OPEN P TO SPEND TALENT POINTS");
  return gains;
}

function buyTalent(p, t) {
  if (p.points < 1 || p.talents[t.id] >= t.max) return;
  p.points--;
  p.talents[t.id]++;
  rebuildHeroStats(p, adv().upgrades[p.name] || 0);
  saveGame(false);
  sfx("save");
  notify(
    p.label +
      " · " +
      t.name.toUpperCase() +
      " " +
      p.talents[t.id] +
      "/" +
      t.max,
  );
}

function levelCheck(p) {
  const levels = [];
  while (p.lvl < 20 && p.xp >= xpRequired(p)) {
    p.xp -= xpRequired(p);
    p.lvl++;
    p.points++;
    rebuildHeroStats(p, adv().upgrades[p.name] || 0);
    levels.push(p.lvl);
    log(p.label + " reached level " + p.lvl + " · +1 talent point");
  }
  if (p.lvl >= 20) p.xp = 0;
  return levels;
}
