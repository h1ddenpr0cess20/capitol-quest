function drawBattle() {
  const sx =
      screenShake && state.settings.shake
        ? randInt(-screenShake, screenShake)
        : 0,
    sy =
      screenShake && state.settings.shake
        ? randInt(-screenShake, screenShake)
        : 0;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.beginPath();
  ctx.rect(0, 0, W, BATTLE_VIEW_H);
  ctx.clip();
  drawBattleBackground();
  drawBattleUnits();
  drawBattleEffects();
  ctx.restore();
  drawBattleHUD();
}

function drawTiledBattleBackground() {
  ctx.fillStyle = "#34577c";
  ctx.fillRect(0, 0, W, 300);
  const sky = ctx.createLinearGradient(0, 70, 0, 305);
  sky.addColorStop(0, "#365780");
  sky.addColorStop(1, "#9fbdca");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 305);
  for (let x = 0; x < W; x += 78) drawLandmark("TREE", x, 182, 2);
  drawLandmark("CAPITOL", 576, 82, 2);
  tileRect("paving", 0, 301, W, 169, 64);
  if (!["MALL", "GROUNDS"].includes(state.zone)) {
    tileRect("floor", 0, 70, W, 400, 64);
    tileRect("carpet", 530, 80, 220, 390, 64);
    for (let x of [40, 265, 970, 1195])
      drawImageRect(TILE.column, x, 94, 72, 143);
    drawImageRect(A.interior.SEAL, 594, 100, 90, 88);
    ctx.fillStyle = state.zone === "PRESS" ? "#13285355" : "#36232322";
    ctx.fillRect(0, 70, W, 400);
  }
  const vignette = ctx.createLinearGradient(0, 300, 0, 470);
  vignette.addColorStop(0, "#050c1500");
  vignette.addColorStop(1, "#050c1555");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 300, W, 170);
}

function drawBattleUnits() {
  state.party.forEach((p) => {
    const pos = partyPos(p),
      pose = battlePartyPose(p);
    drawShadow(pos.x, pos.y, 30, 0.25);
    drawActorFrame(
      pose.meta,
      pose.x,
      pose.y,
      pose.scale,
      false,
      p.alive ? 1 : 0.28,
    );
    if (p.guard) pill("GUARD", pos.x - 32, pos.y - 160, "#a3d6ff");
    if (battle.phase === "input" && currentActor() === p) {
      drawDiamond(pos.x, pos.y - 157, ACCENTS[p.name], 8);
      ctx.strokeStyle = ACCENTS[p.name];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + 3, 38, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (battle.phase === "target" && battle.pending?.targetType === "ally") {
      const selected = battleTargets()[battle.targetIndex] === p;
      if (selected) {
        ctx.strokeStyle = "#95deb8";
        ctx.lineWidth = 3;
        ctx.strokeRect(pos.x - 48, pos.y - 142, 96, 149);
      }
      if (battleTargets().includes(p))
        buttons.push({
          x: pos.x - 65,
          y: pos.y - 145,
          w: 130,
          h: 154,
          label: p.label,
          fn: () => {
            battle.targetIndex = battleTargets().indexOf(p);
            confirmBattleTarget(p);
          },
        });
    }
  });
  battle.enemies.forEach((e) => {
    const pos = enemyPos(e),
      sc = e.boss ? 1.18 : 1.04;
    let x = pos.x;
    if (
      battle.phase === "enemyAction" &&
      battle.action?.actor === e &&
      !e.broken
    )
      x -=
        Math.sin(
          clamp(battle.action.t / battle.action.duration, 0, 1) * Math.PI,
        ) * 48;
    if (e.hitTimer) x += Math.sin(totalTime * 80) * 5;
    drawShadow(pos.x, pos.y, 33, 0.26);
    drawEnemySprite(e.sprite, x, pos.y, sc, false, e.hp > 0 ? 1 : 0.18);
    if (e.hp > 0) {
      box(pos.x - 82, pos.y + 9, 164, 46, "#0b172bdd", "#43566e");
      panelText(e.name, pos.x, pos.y + 15, 13, "#f0f3fa", "center");
      bar(pos.x - 69, pos.y + 36, 138, 7, e.hp, e.maxHp, "#e89080");
      const intent = e.broken ? "BREAK · loses turn" : e.intent?.label || "";
      const iy = pos.y - ACT.enemy[e.sprite].r[3] * sc - 31;
      box(
        pos.x - 100,
        iy,
        200,
        23,
        "#0b172bdf",
        e.broken
          ? "#7fdaeb"
          : e.intent?.kind === "sweep"
            ? "#f8ce76"
            : "#617a8e",
      );
      panelText(
        intent,
        pos.x,
        iy + 5,
        11,
        e.broken ? "#7fdaeb" : "#f3dfb4",
        "center",
      );
      if (
        (battle.phase === "target" && battle.pending?.targetType === "enemy") ||
        battle.phase === "analyze"
      ) {
        const selected = aliveEnemies()[battle.targetIndex] === e;
        if (selected) {
          ctx.strokeStyle = "#f8ce76";
          ctx.lineWidth = 3;
          ctx.strokeRect(pos.x - 83, pos.y - 143, 166, 198);
        }
        buttons.push({
          x: pos.x - 85,
          y: pos.y - 145,
          w: 170,
          h: 200,
          label: e.name,
          fn: () => {
            battle.targetIndex = aliveEnemies().indexOf(e);
            battleInput("enter");
          },
        });
      }
    }
  });
}

function drawBattleCommands() {
  const p = currentActor(),
    phase = battle.phase,
    x = 748;
  if (phase === "input" || phase === "intro") {
    const cmds = [
      BASIC_NAMES[p.name],
      "Skills",
      "Items",
      "Defend",
      "Analyze",
      "Disengage",
    ];
    cmds.forEach((s, i) =>
      uiButton(
        `${i + 1} · ${s}`,
        x + (i % 2) * 256,
        510 + Math.floor(i / 2) * 53,
        244,
        44,
        () => {
          battle.menuIndex = i;
          battleInput("enter");
        },
        {
          active: phase === "input" && battle.menuIndex === i,
          disabled: phase === "intro" || (i === 5 && !!battle.reward.boss),
        },
      ),
    );
    panelText(
      "Weakness × 2 = BREAK · Skills build LIMIT",
      x,
      683,
      12,
      "#9cafc7",
    );
  } else if (phase === "skills") {
    const list = skillsFor(p);
    list.forEach((s, i) =>
      uiButton(
        s.name,
        x + (i % 2) * 256,
        510 + Math.floor(i / 2) * 68,
        244,
        60,
        () => {
          battle.subIndex = i;
          chooseSkill(s);
        },
        {
          active: battle.subIndex === i,
          disabled: !s.limit && p.mp < s.cost,
          sub: s.limit ? "LIMIT · Ready" : s.cost + " MP · " + s.target,
          accent: ACCENTS[p.name],
        },
      ),
    );
    wrapped(list[battle.subIndex]?.desc || "", x, 655, 488, 14, "#b9c9dd", 2);
  } else if (phase === "items") {
    battleItems().forEach(([k, v], i) =>
      uiButton(
        ITEMS[k].name + " ×" + v,
        x + (i % 2) * 256,
        510 + Math.floor(i / 2) * 53,
        244,
        44,
        () => {
          battle.subIndex = i;
          chooseItem(k);
        },
        {
          active: battle.subIndex === i,
        },
      ),
    );
    panelText(
      ITEMS[battleItems()[battle.subIndex]?.[0]]?.desc || "",
      x,
      683,
      13,
      "#b9c9dd",
    );
  } else if (phase === "target") {
    const ts = battleTargets(),
      t = ts[battle.targetIndex];
    text(
      "SELECT " + (battle.pending.targetType === "enemy" ? "ENEMY" : "ALLY"),
      x,
      517,
      21,
      "#f8ce76",
    );
    panelText(t?.label || t?.name || "", x, 554, 19, "#f3f4f7");
    if (battle.pending.targetType === "enemy" && t)
      panelText(
        "Weak: " +
          weakness(t).toUpperCase() +
          (t.resolveTurns
            ? " · RESOLVE: break immune"
            : " · Break " + (t.breakPoints || 0) + "/2"),
        x,
        585,
        14,
        "#90d5e9",
      );
    else if (t)
      panelText(
        "HP " + t.hp + "/" + t.maxHp + " · MP " + t.mp + "/" + t.maxMp,
        x,
        585,
        14,
        "#96d5aa",
      );
    uiButton("← Previous", x, 620, 152, 44, () => battleInput("arrowleft"));
    uiButton("Confirm", x + 162, 620, 164, 44, () => battleInput("enter"), {
      active: true,
    });
    uiButton("Next →", x + 336, 620, 152, 44, () => battleInput("arrowright"));
    panelText(
      "Click a character to confirm · Esc cancel",
      x,
      683,
      12,
      "#9cafc7",
    );
  } else if (phase === "analyze") {
    const e = aliveEnemies()[battle.targetIndex];
    text("ANALYZE · " + e.name, x, 517, 20, "#f8ce76");
    panelText(e.trait, x, 552, 15, "#bcd1e7");
    panelText("Weak: " + weakness(e).toUpperCase(), x, 580, 15, "#90d5e9");
    wrapped(
      "Mark vulnerable for two rounds. Uses this hero’s action.",
      x,
      609,
      480,
      14,
      "#b9c9dd",
      2,
    );
    uiButton("Analyze", x, 657, 488, 42, () => battleInput("enter"), {
      active: true,
    });
  } else if (phase === "victory") {
    text("ENCOUNTER CLEARED", x, 518, 23, "#f8ce76");
    panelText(
      "+" +
        (battle.result?.gold || 0) +
        " CASH     +" +
        (battle.result?.xp || 0) +
        " XP",
      x,
      561,
      18,
      "#e9edf3",
    );
    wrapped(
      "Party recovers 12% HP and 10% MP after victory.",
      x,
      592,
      488,
      14,
      "#b9c9dd",
      2,
    );
    uiButton("Continue →", x, 650, 488, 49, () => battleInput("enter"), {
      active: true,
    });
  } else if (phase === "defeat") {
    text("REGROUP", x, 518, 24, "#efac9b");
    wrapped(
      "Keep your progress. Retry at full strength or return to this area’s rest point.",
      x,
      562,
      488,
      16,
      "#b9c9dd",
      3,
    );
    uiButton("Retry", x, 650, 235, 49, retryBattle, {
      active: true,
    });
    uiButton("Recover", x + 253, 650, 235, 49, retreat);
  } else {
    text(
      phase === "enemyAction"
        ? "ENEMY TURN"
        : phase === "message"
          ? "RESOLVED"
          : "IN MOTION",
      x,
      531,
      22,
      phase === "enemyAction" ? "#efac9b" : "#f8ce76",
    );
    wrapped(battle.message, x, 578, 480, 16, "#b9c9dd", 4);
    if (phase === "message" && !battle.pending?.advanceAfterMessage)
      uiButton("Continue", x, 658, 488, 41, () => battleInput("enter"));
  }
}

function drawBattleBackground() {
  if (["MALL", "GROUNDS"].includes(state.zone) && battleBackdrop.width) {
    ctx.drawImage(battleBackdrop, 0, 0, 1536, 740, 0, 0, W, BATTLE_VIEW_H);
    ctx.fillStyle = "#11254126";
    ctx.fillRect(0, 0, W, BATTLE_VIEW_H);
  } else drawTiledBattleBackground();
}

function resultHUD() {
  const r = battle.result;
  box(0, 470, W, 250, "#102c36", "#78918a");
  text(
    r.multi
      ? "SECURITY WAVE " + (battle.reward.wave + 1) + " / 3 CLEARED"
      : "ENCOUNTER CLEARED",
    23,
    486,
    21,
    UI_GOLD,
  );
  panelText(
    "+" +
      r.xp +
      " XP / HERO    $" +
      r.gold +
      "    " +
      r.rounds +
      " ROUNDS    " +
      r.breaks +
      " BREAKS",
    1258,
    489,
    12,
    UI_INK,
    "right",
  );
  state.party.forEach((p, i) => {
    const x = 18 + i * 312,
      gain = r.gains.find((g) => g.name === p.name);
    box(
      x,
      524,
      300,
      130,
      gain ? "#2d4a45" : "#193944",
      gain ? UI_GOLD : "#4e7078",
    );
    drawPortrait(p.name, x + 12, 539, 44, 55);
    panelText(p.label, x + 67, 539, 14, ACCENTS[p.name]);
    panelText(
      gain ? "LEVEL UP " + gain.from + " → " + gain.to : "LEVEL " + p.lvl,
      x + 67,
      565,
      15,
      gain ? UI_GOLD : UI_INK,
    );
    panelText(
      gain
        ? "+" + (gain.to - gain.from) + " talent point · HP / MP full"
        : p.lvl === 20
          ? "Level cap reached"
          : p.xp + " / " + xpRequired(p) + " XP",
      x + 14,
      605,
      11,
      UI_MUTED,
    );
    bar(x + 14, 635, 271, 6, p.xp, xpRequired(p) || 1, UI_GOLD);
  });
  panelText(
    r.relic
      ? "RELIC UNLOCKED · " + r.relic
      : r.multi
        ? "Next wave restores 18% HP and 15% MP."
        : "Victory recovery: 12% HP / 10% MP. Open P in the world to spend points.",
    23,
    682,
    12,
    r.relic ? UI_GOLD : UI_MUTED,
  );
  uiButton(
    r.multi ? "Next wave →" : "Continue →",
    1062,
    671,
    200,
    36,
    () => finishBattle(true, false),
    {
      active: true,
    },
  );
}

function drawPartyBattle() {
  box(0, 470, W, 250, "#102832", "#527078");
  panelText("PARTY", 23, 486, 12, UI_MUTED);
  panelText("ACTION", 752, 486, 12, UI_MUTED);
  state.party.forEach((p, i) => {
    const x = 18,
      y = 509 + i * 47,
      active =
        currentActor() === p &&
        ["input", "skills", "items", "target", "analyze"].includes(
          battle.phase,
        );
    box(
      x,
      y,
      704,
      43,
      active ? "#2e474a" : "#17353f",
      active ? ACCENTS[p.name] : "#3c5c66",
    );
    drawPortrait(p.name, 23, y + 4, 28, 35);
    panelText(p.label, 61, y + 5, 13, p.alive ? ACCENTS[p.name] : "#7b8e91");
    panelText("LV " + p.lvl, 61, y + 24, 9, UI_MUTED);
    panelText("HP " + p.hp + "/" + p.maxHp, 187, y + 5, 11, "#c8dfd1");
    bar(187, y + 27, 145, 6, p.hp, p.maxHp, "#96c9a7");
    panelText("MP " + p.mp + "/" + p.maxMp, 352, y + 5, 11, "#a5c8da");
    bar(352, y + 27, 113, 6, p.mp, p.maxMp, "#88b5d0");
    panelText(
      p.limit === 100 ? "LIMIT READY" : "LIMIT " + p.limit + "%",
      489,
      y + 5,
      11,
      "#ccaccc",
    );
    bar(489, y + 27, 108, 6, p.limit, 100, "#c196bd");
    wrapped(statusText(p), 617, y + 6, 96, 9, "#b3ccda", 2);
  });
  drawBattleMenuPanel();
}

function drawBattleMenuPanel() {
  const p = currentActor();
  if (battle.phase === "skills") {
    const list = skillsFor(p);
    list.forEach((s, i) =>
      uiButton(
        s.name + (s.limit ? " ★" : " · " + s.cost),
        748 + (i % 2) * 256,
        509 + Math.floor(i / 2) * 51,
        244,
        45,
        () => {
          battle.subIndex = i;
          chooseSkill(s);
        },
        {
          active: battle.subIndex === i,
          disabled: !s.limit && p.mp < s.cost,
          sub: "",
          accent: ACCENTS[p.name],
        },
      ),
    );
    const s = list[battle.subIndex];
    wrapped(
      (s?.limit ? "LIMIT" : (s?.cost || 0) + " MP") + " · " + (s?.desc || ""),
      748,
      672,
      488,
      11,
      UI_MUTED,
      2,
    );
    return;
  }
  drawBattleCommands();
}

function drawBattleHUD() {
  if (battle.phase === "victory") resultHUD();
  else drawPartyBattle();
  box(15, 12, 1250, 60, "#102b35", "#64838a");
  panelText("ROUND " + battle.round, 31, 26, 12, UI_GOLD);
  wrapped(battle.message, 139, 25, 1102, 15, UI_INK, 2);
  uiButton(
    "B · " + AUTO_MODES[state.settings.autoMode],
    18,
    82,
    216,
    39,
    cycleAuto,
    {
      active: state.settings.autoMode > 0,
    },
  );
  uiButton(
    "V · " + state.settings.battleSpeed + "×",
    246,
    82,
    114,
    39,
    () => (state.settings.battleSpeed = (state.settings.battleSpeed % 3) + 1),
  );
  uiButton(
    "Options",
    372,
    82,
    140,
    39,
    () =>
      (modal = {
        type: "automation",
        selection: 0,
      }),
  );
  if (state.settings.autoMode)
    panelText("Esc · manual control", 18, 131, 11, UI_GOLD);
}

// One transform drives both the character and the projectile origin.
function battlePartyPose(p) {
  const pos = partyPos(p),
    scale = BATTLE_SCALE[p.name];
  let x = pos.x,
    y = pos.y,
    meta = ACT.action[p.name][0],
    firing = false;
  const a =
    battle.phase === "action" && battle.action?.actor === p
      ? battle.action
      : null;
  if (a) {
    const t = clamp(a.t / a.duration, 0, 1),
      offensive = ["physical", "magic", "hybrid"].includes(attackType(a));
    if (p.name === "HEGSETH" && offensive) {
      // The source firing frame already contains the flash. Raise, fire, recover;
      // never lunge forward or stretch the shorter, crouched firing pose.
      firing = a.t >= 0.21 && a.t < 0.38;
      meta = ACT.action.HEGSETH[firing ? 2 : a.t >= 0.1 && a.t < 0.65 ? 1 : 0];
      if (firing) x -= 3 * Math.sin(((a.t - 0.21) / 0.17) * Math.PI);
    } else {
      if (
        offensive &&
        p.name === "TRUMP" &&
        (a.kind === "basic" || a.skill?.kind === "physical")
      ) {
        const target = a.target || a.targets?.[0],
          dest = target ? enemyPos(target).x - 100 : x + 72;
        const dash =
          t < 0.42
            ? Math.sin(((t / 0.42) * Math.PI) / 2)
            : t > 0.57
              ? Math.cos((clamp((t - 0.57) / 0.4, 0, 1) * Math.PI) / 2)
              : 1;
        x = lerp(pos.x, dest, dash);
      } else if (offensive)
        x += Math.sin(t * Math.PI) * (p.name === "TRUMP" ? 40 : 12);
      if (t > 0.17 && t < 0.85) meta = ACT.action[p.name][a.pose ?? 0];
    }
  }
  if (p.hitTimer) x += Math.sin(totalTime * 80) * 5;
  return {
    x,
    y,
    scale,
    meta,
    firing,
    muzzle: {
      x: Math.round(x) + Math.round((90 - meta.a[0]) * scale),
      y: Math.round(y) + Math.round((25 - meta.a[1]) * scale),
    },
  };
}
