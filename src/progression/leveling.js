function buyUpgrade(i) {
  const p = state.party[i],
    tier = adv().upgrades[p.name] || 0,
    cost = 140 + tier * 120;
  if (tier >= 2) return notify("TRAINING COMPLETE");
  if (state.cash < cost) return notify("NEED " + cost + " CASH");
  state.cash -= cost;
  adv().upgrades[p.name] = tier + 1;
  p.maxHp += 20;
  p.hp = Math.min(p.maxHp, p.hp + 20);
  p.maxMp += 8;
  p.mp = Math.min(p.maxMp, p.mp + 8);
  p.atk += i === 0 || i === 1 ? 4 : 2;
  p.mag += i === 2 || i === 3 ? 4 : 2;
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
  if (t.id === "power") p.atk += 3;
  if (t.id === "focus") {
    p.mag += 3;
    p.maxMp += 4;
    p.mp += 4;
  }
  if (t.id === "vitality") {
    p.maxHp += 16;
    p.hp += 16;
    p.def += 1;
  }
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
    p.maxHp += 14;
    p.maxMp += 4;
    p.atk += 2;
    p.def += 1;
    p.mag += 2;
    p.luck++;
    p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
    p.mp = Math.min(p.maxMp, p.mp + Math.round(p.maxMp * 0.35));
    p.alive = p.hp > 0;
    levels.push(p.lvl);
    log(p.label + " reached level " + p.lvl + " · +1 talent point");
  }
  if (p.lvl >= 20) p.xp = 0;
  return levels;
}
