function drawStatusOverlay() {
  modalFrame(
    "PARTY & SUPPLIES",
    "Select an ally, select a supply, then use it. Medkits also revive fallen allies.",
  );
  state.party.forEach((p, i) => {
    const x = 58 + i * 294;
    box(
      x,
      170,
      282,
      225,
      allyIndex === i ? "#243149" : "#132138",
      allyIndex === i ? ACCENTS[p.name] : "#344b65",
    );
    drawPortrait(p.name, x + 16, 188, 73, 91);
    text(p.label, x + 103, 191, 17, ACCENTS[p.name]);
    panelText(
      "LV " + p.lvl + " · " + ROLES[p.name],
      x + 103,
      220,
      11,
      "#a5bad0",
    );
    panelText("HP " + p.hp + "/" + p.maxHp, x + 16, 295, 15, "#e2edf9");
    bar(x + 16, 319, 245, 7, p.hp, p.maxHp, "#95deb8");
    panelText("MP " + p.mp + "/" + p.maxMp, x + 16, 337, 14, "#accbef");
    bar(x + 16, 362, 245, 7, p.mp, p.maxMp, "#8cc5ff");
    buttons.push({
      x,
      y: 170,
      w: 282,
      h: 225,
      label: p.label,
      fn: () => {
        allyIndex = i;
      },
    });
  });
  Object.keys(ITEMS).forEach((k, i) => {
    const x = 58 + (i % 3) * 392,
      y = 422 + Math.floor(i / 3) * 83;
    uiButton(
      ITEMS[k].name + " ×" + (state.inventory[k] || 0),
      x,
      y,
      376,
      71,
      () => {
        supplyIndex = i;
      },
      {
        active: supplyIndex === i,
        sub: ITEMS[k].desc,
      },
    );
  });
  uiButton(
    "Use " +
      ITEMS[Object.keys(ITEMS)[supplyIndex]].name +
      " → " +
      state.party[allyIndex].label,
    58,
    610,
    768,
    55,
    () => useFieldItem(Object.keys(ITEMS)[supplyIndex], state.party[allyIndex]),
    {
      active: true,
    },
  );
  panelText("↑↓ item · ←→ ally · Enter use", 858, 630, 13, "#a9bdd3");
}

function drawShop() {
  modalFrame(
    "QUARTERMASTER",
    "$" +
      state.cash +
      " available · Supplies for the road and the next encounter.",
  );
  buttons[buttons.length - 1].fn = () => {
    mode = "world";
    shop = null;
  };
  Object.keys(ITEMS).forEach((k, i) => {
    const x = 58 + (i % 2) * 588,
      y = 176 + Math.floor(i / 2) * 145;
    const it = ITEMS[k];
    box(x, y, 570, 127, "#142238", "#344b65");
    drawItem(k, x + 42, y + 48, 43);
    text(it.name, x + 84, y + 20, 20, "#f4e7c6");
    panelText(it.desc, x + 84, y + 52, 15, "#aabed4");
    uiButton(
      "Buy · $" + it.price,
      x + 345,
      y + 75,
      204,
      37,
      () => {
        shop.selected = i;
        shopInput("enter");
      },
      {
        active: shop.selected === i,
        disabled: state.cash < it.price,
      },
    );
    panelText(
      "In bag: " + (state.inventory[k] || 0),
      x + 21,
      y + 91,
      13,
      "#94abc4",
    );
  });
}

function drawPause() {
  ctx.fillStyle = "#050b17c9";
  ctx.fillRect(0, 0, W, H);
  box(380, 34, 520, 654, "#0d1a2f", "#657e98");
  text("PAUSED", 420, 74, 31, "#f5e6c1");
  panelText(MAPS[state.zone].name, 420, 122, 14, "#8eabc5");
  pauseOptions().forEach((o, i) =>
    uiButton(
      o.label,
      415,
      172 + i * 65,
      450,
      54,
      () => {
        pauseSelection = i;
        o.run();
      },
      {
        active: pauseSelection === i,
      },
    ),
  );
}

function pauseOptions() {
  return [
    {
      label: "Resume",
      run: () => (mode = "world"),
    },
    {
      label: "Save game",
      run: () => saveGame(),
    },
    {
      label: "Auto-battle & difficulty",
      run: () => {
        mode = "world";
        modal = {
          type: "automation",
          selection: 0,
        };
      },
    },
    {
      label: "Party progression",
      run: () => {
        mode = "world";
        modal = {
          type: "talents",
          selection: 0,
        };
      },
    },
    {
      label: "Sound: " + (state.settings.sound ? "ON" : "OFF"),
      run: () => {
        state.settings.sound = !state.settings.sound;
        if (!state.settings.sound) audioCtx?.suspend();
        else audioCtx?.resume();
      },
    },
    {
      label: "Screen shake: " + (state.settings.shake ? "ON" : "OFF"),
      run: () => (state.settings.shake = !state.settings.shake),
    },
    {
      label: "Return to title",
      run: () => {
        saveGame(false);
        mode = "title";
        titleSelection = 0;
      },
    },
  ];
}
