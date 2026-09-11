function getBaseTitleOptions() {
  const has =
    !!storageGet(SAVE_KEY) ||
    !!storageGet(PREVIOUS_SAVE_KEY) ||
    !!storageGet(LEGACY_KEY);
  return [
    {
      label: "NEW GAME",
      sub: "Fix the victory launch",
      run: startNewGame,
    },
    {
      label: "CONTINUE",
      sub: has ? "Resume your latest save" : "No save data",
      disabled: !has,
      run: () => loadGame(true),
    },
    {
      label: "CONTROLS",
      sub: "View controls and systems",
      run: () => {
        overlay = "controls";
      },
    },
  ];
}

function drawScene() {
  ctx.clearRect(0, 0, W, H);
  if (mode === "title") drawTitle();
  else if (mode === "cutscene") drawCutscene();
  else if (mode === "battle") drawBattle();
  else if (mode === "ending") drawEnding();
  else {
    drawWorld();
    if (mode === "dialogue") drawDialogue();
    if (mode === "shop") drawShop();
    if (mode === "pause") drawPause();
    if (overlay === "map") drawMapOverlay();
    if (overlay === "quests") drawQuestOverlay();
    if (overlay === "status") drawStatusOverlay();
    if (overlay === "controls") drawControlsOverlay();
  }
  if (mode === "title" && overlay === "controls") drawControlsOverlay();
  if (toast.time > 0) drawToast();
  if (transition.alpha > 0) {
    ctx.fillStyle = `rgba(4,8,25,${transition.alpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawWorldToast() {
  const alpha = clamp(toast.time / 0.25, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  const w = Math.min(1060, Math.max(400, toast.text.length * 9 + 36)),
    x = (W - w) / 2;
  box(x, 102, w, 52, "#10253cf5", "#8099ae");
  wrapped(toast.text, x + 18, 114, w - 36, 15, "#f4e5bd", 2);
  ctx.restore();
}

function drawSceneWithMenus() {
  buttons = [];
  drawScene();
  if (modal) {
    buttons = [];
    drawModal();
    if (toast.time > 0) drawToast();
  }
  const visibleLabels = buttons
    .filter((b) => !b.disabled)
    .map((b) => b.label)
    .join(", ");
  canvas.setAttribute(
    "aria-label",
    mode === "battle"
      ? `Battle round ${battle.round}. ${battle.message}. ${visibleLabels}`
      : `${mode}. ${getObjective()?.label || "Capitol Quest"}. ${visibleLabels}`,
  );
  canvas.style.cursor = buttons.some(
    (b) =>
      !b.disabled &&
      pointer.x >= b.x &&
      pointer.x < b.x + b.w &&
      pointer.y >= b.y &&
      pointer.y < b.y + b.h,
  )
    ? "pointer"
    : "default";
}

function drawToast() {
  if (overlay || modal || mode === "shop" || mode === "pause") {
    ctx.save();
    ctx.globalAlpha = clamp(toast.time / 0.25, 0, 1);
    box(350, 674, 580, 36, "#192b41", "#7890a6");
    panelText(toast.text, 640, 684, 12, "#f4e5bd", "center");
    ctx.restore();
  } else drawWorldToast();
}

function getTitleOptions() {
  const opts = getBaseTitleOptions(),
    newGame = opts[0];
  newGame.run = () => {
    if (storageGet(SAVE_KEY)) {
      modal = {
        type: "newgame",
        selection: 0,
      };
    } else startNewGame();
  };
  return opts;
}

function drawWhenAssetsReady() {
  const ready = gameImages.filter((im) => im.width > 0).length;
  if (ready < gameImages.length) {
    buttons = [];
    ctx.fillStyle = "#0c172a";
    ctx.fillRect(0, 0, W, H);
    text("CAPITOL QUEST", W / 2, 265, 40, "#f8ce76", "center");
    panelText(
      assetError
        ? "An artwork file is missing. Keep the assets folder beside index.html."
        : "Loading the original artwork…",
      W / 2,
      335,
      17,
      "#a5bdd3",
      "center",
    );
    bar(400, 393, 480, 7, ready, gameImages.length);
    return;
  }
  drawSceneWithMenus();
}

function draw() {
  drawWhenAssetsReady();
  syncTouchMenu();
}

function drawTitle() {
  drawHeadingBackdrop();
  ctx.fillStyle = "#0b242755";
  ctx.fillRect(0, 0, W, H);
  box(46, 42, 722, 628, "#102a31f7", "#748b83");
  panelText("THE VICTORY ENGINE  /  FICTIONAL SATIRE", 85, 79, 13, "#a6c8b9");
  text("CAPITOL", 80, 137, 65, UI_INK);
  text("QUEST", 80, 201, 88, UI_GOLD);
  wrapped(
    "The score is perfect. The city is falling apart. Lead the cabinet through the consequences of its own instructions.",
    85,
    321,
    594,
    19,
    "#bbcec9",
    3,
  );
  panelText(
    "12 DISTRICTS   •   20 LEVELS   •   9 BOSSES",
    85,
    421,
    13,
    UI_GOLD,
  );
  const opts = getTitleOptions();
  opts.forEach((o, i) =>
    uiButton(
      o.label,
      85,
      467 + i * 55,
      626,
      45,
      () => {
        titleSelection = i;
        o.run();
      },
      {
        active: i === titleSelection,
        disabled: o.disabled,
      },
    ),
  );
  ["TRUMP", "HEGSETH", "LUTNICK", "RFK"].forEach((n, i) => {
    const x = 860 + (i % 2) * 220,
      y = 330 + Math.floor(i / 2) * 256;
    drawShadow(x, y, 36, 0.24);
    drawActorFrame(ACT.action[n][0], x, y, BATTLE_SCALE[n] * 1.02, false);
    panelText(ROLES[n], x, y + 24, 12, ACCENTS[n], "center");
  });
  panelText(
    "Original sprites · Offline play · Mouse, keyboard & touch",
    83,
    643,
    11,
    UI_MUTED,
  );
}
