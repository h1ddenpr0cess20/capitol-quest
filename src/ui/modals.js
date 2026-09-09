function drawPuzzleModal() {
  const a = adv();
  if (modal.type === "upgrade") {
    modalFrame(
      "PARTY TRAINING",
      "$" +
        state.cash +
        " available · Permanent upgrades: +30 HP, +12 MP, and stronger attacks.",
    );
    state.party.forEach((p, i) => {
      const tier = a.upgrades[p.name] || 0,
        cost = 140 + tier * 120;
      drawPortrait(p.name, 66, 176 + i * 116, 66, 83);
      uiButton(
        p.label + " · " + ROLES[p.name],
        154,
        176 + i * 116,
        1052,
        98,
        () => {
          modal.selection = i;
          buyUpgrade(i);
        },
        {
          active: modal.selection === i,
          disabled: tier >= 2 || state.cash < cost,
          sub:
            tier >= 2
              ? "Fully trained"
              : `Tier ${tier + 1}/2 · $${cost} · +7 ${i < 2 ? "ATK" : "MAG"}, +3 ${i < 2 ? "MAG" : "ATK"}`,
        },
      );
    });
  } else if (modal.type === "archive") {
    modalFrame(
      "THE LEDGER VAULT",
      "A document moves through intake, transfer, and release. Enter those catalog stamps in order.",
    );
    CATALOG.forEach((c, i) => {
      const x = 64 + i * 394;
      box(x, 183, 378, 179, "#172840", "#47637f");
      pill("CATALOG " + (i + 1), x + 21, 204, "#91bddb");
      text(
        a.catalog.includes(i) ? c.label : "CARD MISSING",
        x + 22,
        250,
        23,
        a.catalog.includes(i) ? "#f8ce76" : "#758ba2",
      );
      panelText(
        a.catalog.includes(i)
          ? "Recovered from the stacks"
          : "Find the marked shelf",
        x + 22,
        300,
        15,
        "#aabed4",
      );
    });
    panelText("STAMP SEQUENCE", 64, 402, 14, "#91bddb");
    text(
      a.archiveCode
        .map((i) => ["04", "17", "29"][i])
        .concat(Array(3 - a.archiveCode.length).fill("__"))
        .join("  →  "),
      64,
      440,
      34,
      "#f4e5bd",
    );
    [0, 1, 2].forEach((v, i) =>
      uiButton(
        ["1 · 04 / Intake", "2 · 17 / Transfer", "3 · 29 / Release"][i],
        64 + i * 394,
        521,
        378,
        64,
        () => {
          modal.selection = i;
          modalInput("enter");
        },
        {
          active: modal.selection === i,
          disabled: a.catalog.length < 3,
        },
      ),
    );
    panelText(
      "Choose three stamps · Wrong sequences reset without a penalty",
      64,
      628,
      15,
      "#aabed4",
    );
  } else if (modal.type === "channel") {
    modalFrame(
      "RELAY TUNER",
      "The maintenance card reads 2 / 4 / 1. Match all three channels, then reconnect.",
    );
    for (let i = 0; i < 3; i++) {
      const x = 130 + i * 350;
      box(
        x,
        184,
        310,
        335,
        "#15273e",
        modal.selection === i ? "#f8ce76" : "#47637f",
      );
      panelText(
        ["CARRIER", "PHASE", "GAIN"][i],
        x + 155,
        210,
        16,
        "#a5c4dd",
        "center",
      );
      uiButton(
        "▲",
        x + 40,
        253,
        230,
        47,
        () => {
          modal.selection = i;
          modalInput("arrowup");
        },
        {
          active: modal.selection === i,
        },
      );
      text(a.channel[i], x + 155, 319, 82, "#f8ce76", "center");
      uiButton("▼", x + 40, 438, 230, 47, () => {
        modal.selection = i;
        modalInput("arrowdown");
      });
    }
    uiButton("Reconnect relay", 130, 560, 1010, 65, () => modalInput("enter"), {
      active: true,
    });
    panelText(
      "←→ choose channel · ↑↓ tune · Enter reconnect",
      130,
      646,
      15,
      "#aabed4",
    );
  }
}

function drawAdventureModal() {
  if (modal.type === "newgame") {
    modalFrame(
      "START A NEW GAME?",
      "Your current autosave will be replaced once the new introduction ends.",
    );
    wrapped(
      "You can continue your existing adventure from the title screen. Your earlier save slot stays untouched.",
      64,
      235,
      1120,
      23,
      "#cedbe9",
      4,
    );
    uiButton(
      "Keep current game",
      64,
      470,
      548,
      70,
      () => {
        modal = null;
      },
      {
        active: modal.selection === 0,
      },
    );
    uiButton(
      "Begin new game",
      642,
      470,
      548,
      70,
      () => {
        modal = null;
        startNewGame();
      },
      {
        active: modal.selection === 1,
      },
    );
    return;
  }
  drawPuzzleModal();
}

function drawModal() {
  if (modal.type === "talents") {
    modalFrame(
      "PARTY PROGRESSION",
      "Earn XP through battles and exploration. Each level grants a talent point; skills unlock at levels 1, 2, 4, 6 and 9.",
    );
    state.party.forEach((p, i) => {
      const x = 58 + i * 295;
      box(
        x,
        177,
        281,
        470,
        "#193843",
        modal.selection === i ? ACCENTS[p.name] : "#486974",
      );
      drawPortrait(p.name, x + 17, 194, 54, 68);
      text(p.label, x + 86, 198, 17, ACCENTS[p.name]);
      panelText(ROLES[p.name], x + 86, 226, 10, UI_MUTED);
      panelText("LEVEL " + p.lvl + " / 20", x + 18, 280, 16, UI_GOLD);
      panelText(
        p.points + " TALENT POINT" + (p.points === 1 ? "" : "S"),
        x + 18,
        310,
        12,
        p.points ? UI_GOLD : UI_MUTED,
      );
      bar(x + 18, 342, 245, 8, p.xp, xpRequired(p) || 1, UI_GOLD);
      panelText(
        p.lvl >= 20 ? "MAX LEVEL" : p.xp + " / " + xpRequired(p) + " XP",
        x + 18,
        360,
        11,
        UI_MUTED,
      );
      TALENTS.forEach((t, j) =>
        uiButton(
          t.name + " " + p.talents[t.id] + "/" + t.max,
          x + 14,
          392 + j * 62,
          253,
          55,
          () => {
            modal.selection = i;
            buyTalent(p, t);
          },
          {
            disabled: !p.points || p.talents[t.id] >= t.max,
            sub: t.desc,
            accent: ACCENTS[p.name],
          },
        ),
      );
      const next = SKILL_LEVELS.find((l) => l > p.lvl);
      panelText(
        next ? "NEXT SKILL · LV " + next : "ALL SKILLS UNLOCKED",
        x + 18,
        590,
        11,
        UI_GOLD,
      );
      wrapped(
        next
          ? PARTY_DEFS[p.name].skills[SKILL_LEVELS.indexOf(next)].name
          : "Master your role. Level cap: 20.",
        x + 18,
        613,
        245,
        11,
        UI_MUTED,
        2,
      );
    });
    return;
  }
  if (modal.type === "automation") {
    modalFrame(
      "AUTO-BATTLE & PACE",
      "Changes apply immediately. B cycles battle mode; V changes speed; Esc takes manual control.",
    );
    AUTO_MODES.forEach((name, i) =>
      uiButton(name, 58 + i * 296, 181, 280, 78, () => setAutoMode(i), {
        active: state.settings.autoMode === i,
        sub: [
          "Choose every action",
          "Heal, buff & exploit weakness",
          "Spend MP for stronger attacks",
          "Basic attacks; heal when needed",
        ][i],
      }),
    );
    const rows = [
      [
        "Battle speed",
        state.settings.battleSpeed + "×",
        () =>
          (state.settings.battleSpeed = (state.settings.battleSpeed % 3) + 1),
        "Speeds up actions and enemy turns.",
      ],
      [
        "Use consumables",
        state.settings.autoItems ? "ON" : "OFF",
        () => (state.settings.autoItems = !state.settings.autoItems),
        "Allow auto-battle to spend healing and revive items.",
      ],
      [
        "Use Limit moves",
        state.settings.autoLimits ? "ON" : "OFF",
        () => (state.settings.autoLimits = !state.settings.autoLimits),
        "Use offensive and healing Limits when helpful.",
      ],
      [
        "Continue after wins",
        state.settings.autoContinue ? "ON" : "OFF",
        () => (state.settings.autoContinue = !state.settings.autoContinue),
        "Ordinary wins advance after 1.5s. Level-ups and bosses pause.",
      ],
      [
        "Difficulty",
        state.settings.difficulty,
        () => {
          const names = ["Story", "Standard", "Tactical"];
          state.settings.difficulty =
            names[(names.indexOf(state.settings.difficulty) + 1) % 3];
        },
        "Applies to the next encounter. Progress rewards stay the same.",
      ],
    ];
    rows.forEach(([label, value, fn, sub], i) => {
      panelText(label, 66, 295 + i * 70, 16, UI_INK);
      panelText(sub, 66, 322 + i * 70, 12, UI_MUTED);
      uiButton(value + " ↻", 970, 286 + i * 70, 232, 55, fn, {
        active: true,
      });
    });
    return;
  }
  if (modal.type === "mission") {
    const z = modal.zone,
      m = SIDE_MISSIONS[z],
      s = sideState(z);
    modalFrame(
      m.title,
      "SIDE MISSION / " + MAPS[z].name + " / LEVEL " + DISTRICTS[z].level + "+",
    );
    wrapped(m.intro, 65, 199, 1100, 23, UI_INK, 4);
    m.items.forEach((it, i) => {
      panelText(
        s.nodes.includes(i) ? "✓" : "○",
        72,
        358 + i * 49,
        20,
        s.nodes.includes(i) ? "#a1d9ad" : UI_GOLD,
      );
      panelText(it, 112, 360 + i * 49, 18, UI_INK);
    });
    box(65, 531, 1139, 100, "#294b4e", "#7c9991");
    text(m.relic, 86, 549, 20, UI_GOLD);
    panelText(m.reward, 86, 584, 15, UI_INK);
    return;
  }
  if (modal.type === "trials") {
    modalFrame(
      "THE CHALLENGE BOARD",
      "Six repeatable encounters. Earn XP and cash every run. Three stars: win in four rounds with all heroes standing.",
    );
    TRIALS.forEach((t, i) => {
      const x = 58 + (i % 2) * 592,
        y = 181 + Math.floor(i / 2) * 159,
        stars = state.expedition.trials[i] || 0;
      box(x, y, 574, 144, "#193a44", "#54737b");
      panelText(
        "LV " + t.level + "   " + ("★".repeat(stars) + "☆".repeat(3 - stars)),
        x + 17,
        y + 13,
        12,
        UI_GOLD,
      );
      text(t.name, x + 17, y + 39, 19, UI_INK);
      wrapped(t.desc, x + 17, y + 72, 530, 12, UI_MUTED, 2);
      uiButton("Challenge →", x + 341, y + 101, 215, 33, () => beginTrial(i));
      panelText(
        "+" + t.xp + " XP · $" + t.gold,
        x + 17,
        y + 112,
        11,
        "#abcab3",
      );
    });
    return;
  }
  if (modal.type === "newgame") {
    modalFrame(
      "START A NEW GAME?",
      "Your autosave will be replaced after the introduction. Export it first if you want to keep a separate copy.",
    );
    wrapped(
      "Your earlier save slot remains available. Choose Continue to migrate it into the new districts.",
      65,
      235,
      1100,
      23,
      UI_INK,
      4,
    );
    uiButton("Keep current game", 65, 468, 544, 70, () => (modal = null), {
      active: modal.selection === 0,
    });
    uiButton(
      "Begin new game",
      641,
      468,
      544,
      70,
      () => {
        modal = null;
        startNewGame();
      },
      {
        active: modal.selection === 1,
      },
    );
    return;
  }
  drawAdventureModal();
}

function drawControlsOverlay() {
  modalFrame(
    "HOW TO PLAY",
    "A complete story, six side missions, six repeatable trials, and progression through level 20.",
  );
  const rows = [
    ["MOVE", "WASD / arrows, Shift to sprint, or click a destination."],
    ["INTERACT", "E / Enter near a person or marker. Click to walk to it."],
    ["MAP", "M opens the connected atlas. Tab switches to the local map."],
    ["PROGRESSION", "P opens talents. Spend 1 / 2 / 3 on the selected hero."],
    ["MENUS", "I supplies, Q journal, B auto-battle options, Esc pause."],
    [
      "BATTLE",
      "Read enemy intent. Two weakness hits cause BREAK; bosses then resist breaks for one round.",
    ],
    ["RECOVER", "Basic attacks restore 5 MP; Defend restores 10 MP."],
    ["AUTO-BATTLE", "B cycles modes; V changes speed; Esc takes control."],
    [
      "EXPLORATION",
      "Side missions unlock relics. The Mall board offers repeatable trials.",
    ],
    [
      "SAVE",
      "Rest, F5, and autosave. Export / Import carries saves between browsers.",
    ],
  ];
  rows.forEach(([a, b], i) => {
    panelText(a, 65, 184 + i * 42, 13, UI_GOLD);
    panelText(b, 245, 184 + i * 42, 13, UI_INK);
  });
  panelText(
    "Original sprite set. This game is fictional satire. Landscape is best on small screens.",
    65,
    641,
    11,
    UI_MUTED,
  );
}
