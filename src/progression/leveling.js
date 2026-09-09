function buyUpgrade(i) {
  const p = state.party[i],
    tier = adv().upgrades[p.name] || 0,
    cost = 140 + tier * 120;
  if (tier >= 2) return notify("TRAINING COMPLETE");
  if (state.cash < cost) return notify("NEED " + cost + " CASH");
  state.cash -= cost;
  adv().upgrades[p.name] = tier + 1;
  p.maxHp += 30;
  p.hp = Math.min(p.maxHp, p.hp + 30);
  p.maxMp += 12;
  p.mp = Math.min(p.maxMp, p.mp + 12);
  p.atk += i === 0 || i === 1 ? 7 : 3;
  p.mag += i === 2 || i === 3 ? 7 : 3;
  notify(p.label + " TRAINING UPGRADED");
  saveGame(false);
}

function xpRequired(p) {
  return p.lvl >= 20 ? 0 : 100 + (p.lvl - 1) * 45;
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
  if (t.id === "power") p.atk += 4;
  if (t.id === "focus") {
    p.mag += 4;
    p.maxMp += 6;
    p.mp += 6;
  }
  if (t.id === "vitality") {
    p.maxHp += 24;
    p.hp += 24;
    p.def += 2;
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
    p.maxHp += 20;
    p.maxMp += 7;
    p.atk += 4;
    p.def += 2;
    p.mag += 4;
    p.luck++;
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    p.alive = true;
    levels.push(p.lvl);
    log(p.label + " reached level " + p.lvl + " · +1 talent point");
  }
  if (p.lvl >= 20) p.xp = 0;
  return levels;
}
