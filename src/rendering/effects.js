function updateEffects(dt) {
  for (const u of [...state.party, ...(battle?.enemies || [])])
    u.hitTimer = Math.max(0, (u.hitTimer || 0) - dt);
  for (const fx of spriteFx) fx.t += dt;
  spriteFx = spriteFx.filter((fx) => fx.t < fx.duration);
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 55 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
  for (const f of floaters) {
    f.y -= 42 * dt;
    f.life -= dt;
  }
  floaters = floaters.filter((f) => f.life > 0);
  screenShake = Math.max(0, screenShake - dt * 18);
}

function addFx(kind, x, y) {
  const mapped = kind === "magic" ? "debuff" : kind;
  if (A.effects[mapped])
    spriteFx.push({
      kind: mapped,
      x,
      y,
      t: 0,
      duration: kind === "gun" ? 0.42 : kind === "hit" ? 0.48 : 0.62,
    });
  for (let i = 0; i < (kind === "magic" ? 22 : 14); i++)
    particles.push({
      x,
      y,
      vx: randInt(-90, 90),
      vy: randInt(-110, 30),
      life: 0.45 + Math.random() * 0.35,
      kind,
      size: randInt(3, 8),
    });
}

function addFloater(t, text, color) {
  const pos =
    "name" in t && state.party.includes(t) ? partyPos(t) : enemyPos(t);
  floaters.push({
    x: pos.x,
    y: pos.y - 92,
    text,
    color,
    life: 0.9,
  });
}

function drawEffectParticles() {
  for (const fx of spriteFx) {
    const frames = EXTRA[fx.kind];
    if (!frames) continue;
    const i = Math.min(
        frames.length - 1,
        Math.floor((fx.t / fx.duration) * frames.length),
      ),
      r = frames[i],
      sc = 1.6;
    ctx.globalAlpha = 1 - (fx.t / fx.duration) * 0.45;
    drawExtra(
      fx.kind,
      fx.x - (r[2] * sc) / 2,
      fx.y - (r[3] * sc) / 2,
      r[2] * sc,
      r[3] * sc,
      i,
    );
  }
  ctx.globalAlpha = 1;
  for (const f of floaters) {
    ctx.globalAlpha = clamp(f.life / 0.9, 0, 1);
    ctx.strokeStyle = "#0b1526";
    ctx.lineWidth = 4;
    ctx.font = '700 19px "QuestMono", monospace';
    ctx.textAlign = "center";
    ctx.strokeText(f.text, f.x, f.y);
    text(f.text, f.x, f.y, 19, f.color, "center");
  }
  ctx.globalAlpha = 1;
}

function drawBattleEffects() {
  const a = battle.action;
  if (
    battle.phase === "action" &&
    a?.actor &&
    a.t > 0.12 &&
    a.t < 0.36 &&
    attackType(a) !== "none" &&
    a.actor.name !== "TRUMP"
  ) {
    const targets = (a.target ? [a.target] : a.targets || []).filter((e) =>
      battle.enemies.includes(e),
    );
    for (const target of targets) {
      const from = partyPos(a.actor),
        to = enemyPos(target),
        t = clamp((a.t - 0.12) / 0.24, 0, 1),
        key =
          a.actor.name === "HEGSETH"
            ? "gun"
            : a.actor.name === "LUTNICK"
              ? "money"
              : "heal",
        frame = a.actor.name === "HEGSETH" ? 1 : 2;
      const r = EXTRA[key][frame];
      drawExtra(
        key,
        lerp(from.x + 35, to.x, t) - r[2] / 2,
        lerp(from.y - 72, to.y - 64, t) - r[3] / 2,
        r[2] * 1.3,
        r[3] * 1.3,
        frame,
      );
    }
  }
  drawEffectParticles();
}
