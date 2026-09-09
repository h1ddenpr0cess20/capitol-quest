function drawWorld() {
  updateCamera();
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, WORLD_VIEW_H);
  ctx.clip();
  const shake =
    screenShake && state.settings.shake
      ? [randInt(-screenShake, screenShake), randInt(-screenShake, screenShake)]
      : [0, 0];
  ctx.translate(-camera.x + shake[0], -camera.y + shake[1]);
  drawMapBase(state.zone);
  drawMapObjects(state.zone);
  drawWorldEntities();
  ctx.restore();
  if (mode === "world" && !overlay) drawWorldHUD();
}

function drawWorldEntities() {
  const actors = npcList().map((n) => ({
    y: n.y,
    draw: () => drawNPC(n),
  }));
  for (const mob of WORLD_ENCOUNTERS[state.zone] || []) {
    if (state.defeated[mobKey(state.zone, mob.id)]) continue;
    const mm = worldMobMotion[mobKey(state.zone, mob.id)] || mob;
    actors.push({
      y: mm.y,
      draw: () => drawMob(mob, mm),
    });
  }
  ["HEGSETH", "LUTNICK", "RFK"].forEach((name, i) => {
    const tp = followerAt(46 * (i + 1));
    if (dist(tp, state.player) < 12) return;
    actors.push({
      y: tp.y,
      draw: () => {
        drawShadow(tp.x, tp.y, 21, 0.2);
        drawPartySprite(name, tp.dir, tp.frame, tp.x, tp.y, 1, 0.98);
      },
    });
  });
  actors.push({
    y: state.player.y,
    draw: () => {
      drawShadow(state.player.x, state.player.y, 23);
      drawPartySprite(
        "TRUMP",
        state.player.dir,
        state.player.frame,
        state.player.x,
        state.player.y,
        1,
      );
    },
  });
  actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
}

function drawMob(m, mm) {
  drawShadow(mm.x, mm.y, 21, 0.2);
  drawFacingEnemy(m.type, mm.x, mm.y, 0.63, mm.dir || "left");
  drawDiamond(mm.x, mm.y - 91, encounterGrace ? "#758a9b" : "#ed8c7b", 5);
  if (dist(mm, state.player) < 190) {
    pill("LV " + m.level, mm.x - 25, mm.y + 10, "#f2b6a7");
  }
}

function drawNPC(n) {
  drawShadow(n.x, n.y, 20, 0.18);
  if (ACT.npc[n.sprite]) {
    const front = n.sprite.startsWith("CIV")
        ? "CIV1"
        : n.sprite.startsWith("COP")
          ? "COP1"
          : "POL1",
      back = front === "CIV1" ? "CIV2" : front === "COP1" ? "COP2" : "POL2";
    drawNpcSprite(state.player.y < n.y - 35 ? back : front, n.x, n.y, 1.03);
  } else
    drawFacingEnemy(
      n.sprite,
      n.x,
      n.y,
      0.64,
      state.player.x < n.x ? "left" : "right",
    );
  if (dist(n, state.player) < 240) {
    const w = n.name.length * 8 + 22;
    box(n.x - w / 2, n.y - 107, w, 25, "#102934ed", "#75b5bb");
    panelText(n.name, n.x, n.y - 102, 12, "#d6f0e7", "center");
  }
}

function drawNavigator() {
  const ob = localObjective();
  if (!ob) return;
  const x = ob.x - camera.x,
    y = ob.y - camera.y;
  if (x > 55 && x < W - 55 && y > 125 && y < WORLD_VIEW_H - 35) return;
  const dx = x - W / 2,
    dy = y - 320,
    k = Math.min(
      570 / Math.max(1, Math.abs(dx)),
      180 / Math.max(1, Math.abs(dy)),
    ),
    sx = W / 2 + dx * k,
    sy = 320 + dy * k;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.fillStyle = "#ffdf8c";
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(-8, -8);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWorldHUD() {
  const d = DISTRICTS[state.zone];
  box(18, 18, 415, 75, "#102b33f2", "#526f72");
  panelText(
    "DISTRICT " +
      String(Object.keys(DISTRICTS).indexOf(state.zone) + 1).padStart(2, "0") +
      " / 12   •   LV " +
      d.level +
      "+",
    34,
    30,
    11,
    d.color,
  );
  text(d.name, 34, 53, 20, UI_INK);
  box(732, 18, 530, 75, "#102b33f2", "#526f72");
  panelText("NEXT OBJECTIVE", 750, 29, 11, UI_GOLD);
  wrapped(
    getObjective()?.label || "Explore the district",
    750,
    49,
    490,
    14,
    UI_INK,
    2,
  );
  box(463, 18, 230, 126, "#15353de8", "#607f80");
  miniMap(469, 24, 218, 114);
  buttons.push({
    x: 463,
    y: 18,
    w: 230,
    h: 126,
    label: "Open district atlas",
    fn: () => {
      atlasTab = "local";
      overlay = "map";
    },
  });
  drawNavigator();
  box(0, 548, W, 172, "#102832", "#5b7779");
  state.party.forEach((p, i) => {
    const x = 18 + i * 248;
    box(x, 563, 236, 112, "#18343e", "#456269");
    drawPortrait(p.name, x + 9, 575, 45, 56);
    panelText(p.label, x + 65, 574, 13, ACCENTS[p.name]);
    panelText(
      "LV " + p.lvl + (p.points ? "  +" + p.points + " PT" : ""),
      x + 65,
      594,
      12,
      UI_GOLD,
    );
    panelText("HP " + p.hp + "/" + p.maxHp, x + 65, 614, 11, "#c4dfca");
    bar(x + 65, 634, 152, 6, p.hp, p.maxHp, "#91c5a4");
    panelText("MP " + p.mp + "/" + p.maxMp, x + 10, 646, 10, "#99c7db");
    bar(x + 111, 649, 107, 5, p.mp, p.maxMp, "#91bfd3");
    bar(x + 10, 666, 208, 3, p.xp, xpRequired(p) || 1, UI_GOLD);
    buttons.push({
      x,
      y: 563,
      w: 236,
      h: 112,
      label: p.label + " progression",
      fn: () =>
        (modal = {
          type: "talents",
          selection: i,
        }),
    });
  });
  uiButton(
    "P · Progression",
    1020,
    563,
    242,
    47,
    () =>
      (modal = {
        type: "talents",
        selection: 0,
      }),
  );
  uiButton("M · District atlas", 1020, 620, 242, 47, () => {
    atlasTab = "districts";
    atlasSelection = state.zone;
    overlay = "map";
  });
  const near = nearestInteraction();
  panelText(
    near
      ? "E · " + (near.data.label || near.data.name)
      : "Click to walk  ·  Shift sprint  ·  I supplies  ·  B auto-battle",
    24,
    692,
    12,
    near ? UI_GOLD : UI_MUTED,
  );
  panelText(
    "$" +
      state.cash +
      "   •   " +
      Object.values(state.expedition.missions).filter((s) => s.complete)
        .length +
      "/6 MISSIONS",
    1253,
    692,
    12,
    UI_GOLD,
    "right",
  );
  if (near)
    buttons.push({
      x: 0,
      y: 679,
      w: 720,
      h: 41,
      label: "Interact",
      fn: interact,
    });
}
