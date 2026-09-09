function createBaseState() {
  return {
    started: false,
    zone: "MALL",
    chapter: 1,
    mainStage: 0,
    playTime: 0,
    player: {
      x: MAPS.MALL.spawn.x,
      y: MAPS.MALL.spawn.y,
      dir: "down",
      frame: 0,
      step: 0,
      speed: 205,
    },
    party: Object.entries(PARTY_DEFS).map(([name, d]) => ({
      name,
      label: d.label,
      lvl: 3,
      xp: 0,
      hp: d.maxHp,
      maxHp: d.maxHp,
      mp: d.maxMp,
      maxMp: d.maxMp,
      atk: d.atk,
      def: d.def,
      mag: d.mag,
      luck: d.luck,
      limit: 0,
      alive: true,
      status: {},
    })),
    inventory: {
      POTION: 4,
      SUPER: 2,
      MEDKIT: 1,
      STEAK: 1,
      BURGER: 2,
      SERUM: 2,
    },
    cash: 140,
    flags: {
      veteranClue: false,
      teacherClue: false,
      megaphone: false,
      sentinel: false,
      ledger: false,
      fixer: false,
      transcript: false,
      factChecked: false,
      chair: false,
      ending: false,
    },
    witnesses: {
      protester: false,
      veteran: false,
      teacher: false,
      student: false,
      nurse: false,
      scientist: false,
      journalist: false,
      organizer: false,
      editor: false,
      producer: false,
    },
    evidence: {
      usb: 0,
      files: 0,
    },
    defeated: {},
    opened: {},
    log: [],
    settings: {
      sound: true,
      shake: true,
    },
    endingChoice: null,
    adventure: {
      breakers: [],
      catalog: [],
      archiveCode: [],
      archiveOpen: false,
      channel: [0, 0, 0],
      channelOpen: false,
      briefs: [],
      upgrades: {},
      chests: {},
      visited: {
        MALL: true,
      },
      battles: 0,
    },
  };
}

function beginIntroduction() {
  Object.assign(state, freshState());
  overlay = null;
  battle = null;
  dialogue = null;
  shop = null;
  ending = null;
  worldMobMotion = {};
  particles = [];
  spriteFx = [];
  floaters = [];
  encounterGrace = 2;
  transition = {
    alpha: 0,
    dir: 0,
    callback: null,
  };
  state.started = true;
  mode = "cutscene";
  cutscene = {
    i: 0,
    pages: [
      {
        speaker: "NARRATOR",
        text: "The Civic Relay goes live tonight. Its public archive is supposed to carry every word of the final hearing. Someone has queued a different version.",
      },
      {
        speaker: "NARRATOR",
        text: "Then the relay key disappears inside a ceremonial megaphone. The trail leads from a rally on the Mall to the locked doors of the Capitol.",
      },
      {
        speaker: "TRUMP",
        portrait: "TRUMP",
        text: "A missing megaphone. In this town. Nobody is going to believe that. Find the cart, get the key, and keep every original.",
      },
      {
        speaker: "NARRATOR",
        text: "Start with the Protester on the Mall. Follow the gold objective marker. Hold Shift to sprint; use the rest points to recover and save. The training post offers an optional practice battle.",
      },
    ],
    onDone: () => {
      mode = "world";
      setStage(0, true);
      saveGame(false);
    },
  };
  resetTrail();
}

function saveGame(show = true) {
  try {
    state.playTime += 0;
    if (
      !storageSet(
        SAVE_KEY,
        JSON.stringify({
          version: VERSION,
          state,
        }),
      )
    )
      throw new Error("storage unavailable");
    if (show) {
      notify("GAME SAVED");
      sfx("save");
    }
  } catch (e) {
    notify("SAVE FAILED");
    sfx("error");
  }
}

function restoreSavedGame(show = true) {
  try {
    let raw = storageGet(SAVE_KEY) || storageGet(PREVIOUS_SAVE_KEY);
    let data = raw ? JSON.parse(raw) : null;
    if (!data) {
      const legacy = storageGet(LEGACY_KEY);
      if (legacy) data = migrateLegacy(JSON.parse(legacy));
    }
    if (!data?.state) throw new Error("bad save");
    const fresh = freshState();
    mergeState(fresh, data.state);
    Object.assign(state, fresh);
    state.started = true;
    mode = "world";
    overlay = null;
    dialogue = null;
    shop = null;
    battle = null;
    ending = null;
    transition = {
      alpha: 0,
      dir: 0,
      callback: null,
    };
    recoverPlayerPosition();
    resetTrail();
    if (show) notify("SAVE LOADED");
  } catch (e) {
    notify("SAVE DATA COULD NOT BE LOADED");
    sfx("error");
    mode = "title";
  }
}

function mergeSavedFields(dst, src) {
  for (const k of Object.keys(dst)) {
    if (src[k] === undefined) continue;
    if (
      dst[k] &&
      typeof dst[k] === "object" &&
      !Array.isArray(dst[k]) &&
      src[k] &&
      typeof src[k] === "object" &&
      !Array.isArray(src[k])
    )
      Object.assign(dst[k], src[k]);
    else dst[k] = src[k];
  }
  dst.party = (src.party || dst.party).map((p, i) =>
    Object.assign({}, freshState().party[i], p, {
      status: {
        ...(p.status || {}),
      },
    }),
  );
  dst.mainStage = clamp(Number(dst.mainStage) || 0, 0, 9);
  if (!MAPS[dst.zone]) dst.zone = "MALL";
  dst.player.x = clamp(dst.player.x, 60, MAPS[dst.zone].w - 60);
  dst.player.y = clamp(dst.player.y, 90, MAPS[dst.zone].h - 60);
}

function exportSave() {
  const payload = JSON.stringify(
      {
        version: VERSION,
        state,
      },
      null,
      2,
    ),
    link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([payload], {
      type: "application/json",
    }),
  );
  link.download = "Capitol_Quest_Save.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  notify("SAVE EXPORTED");
}

function importSaveFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (
        !data.state ||
        !Array.isArray(data.state.party) ||
        !data.state.player ||
        !MAPS[data.state.zone]
      )
        throw Error("invalid");
      const clean = freshState();
      mergeState(clean, data.state);
      if (
        clean.party.some(
          (p) =>
            !PARTY_DEFS[p.name] ||
            ![p.hp, p.mp, p.maxHp, p.maxMp, p.atk, p.def, p.mag].every(
              Number.isFinite,
            ),
        )
      )
        throw Error("invalid");
      storageSet(
        SAVE_KEY,
        JSON.stringify({
          version: VERSION,
          state: clean,
        }),
      );
      modal = null;
      loadGame();
    } catch (e) {
      notify("SAVE FILE COULD NOT BE READ");
    }
  };
  reader.readAsText(file);
}

function mergeSavedAdventure(dst, src) {
  mergeSavedFields(dst, src);
  const defaults = freshState().adventure;
  dst.adventure = {
    ...defaults,
    ...src.adventure,
    upgrades: {
      ...defaults.upgrades,
      ...src.adventure?.upgrades,
    },
    chests: {
      ...src.adventure?.chests,
    },
    visited: {
      MALL: true,
      ...src.adventure?.visited,
    },
  };
  dst.party = freshState().party.map((p, i) => {
    const saved =
      src.party?.find((q) => q.name === p.name) || src.party?.[i] || {};
    return {
      ...p,
      ...saved,
      status: {},
      alive: (saved.hp ?? p.hp) > 0,
    };
  });
}

function freshState() {
  const s = createBaseState();
  s.expedition = {
    version: 6,
    missions: {},
    trials: {},
    talents: {},
    discovered: {
      MALL: true,
    },
    totalXP: 0,
  };
  s.settings = {
    ...s.settings,
    autoMode: 0,
    battleSpeed: 1,
    autoItems: false,
    autoLimits: true,
    autoContinue: false,
    difficulty: "Standard",
  };
  s.party.forEach((p) => {
    p.lvl = 1;
    p.points = 0;
    p.talents = {
      power: 0,
      focus: 0,
      vitality: 0,
    };
  });
  s.player.x = MAPS.MALL.spawn.x;
  s.player.y = MAPS.MALL.spawn.y;
  s.player.dir = "right";
  return s;
}

function mergeState(dst, src) {
  mergeSavedAdventure(dst, src);
  const defaults = freshState();
  dst.expedition = {
    ...defaults.expedition,
    ...src.expedition,
    missions: {
      ...src.expedition?.missions,
    },
    trials: {
      ...src.expedition?.trials,
    },
    discovered: {
      MALL: true,
      ...src.expedition?.discovered,
    },
  };
  dst.settings = {
    ...defaults.settings,
    ...src.settings,
  };
  dst.settings.autoMode = clamp(Number(dst.settings.autoMode) || 0, 0, 3) | 0;
  dst.settings.battleSpeed = [1, 2, 3].includes(dst.settings.battleSpeed)
    ? dst.settings.battleSpeed
    : 1;
  dst.settings.difficulty = ["Story", "Standard", "Tactical"].includes(
    dst.settings.difficulty,
  )
    ? dst.settings.difficulty
    : "Standard";
  for (const p of dst.party) {
    p.lvl = clamp(Math.floor(Number(p.lvl) || 1), 1, 20);
    p.xp = Math.max(0, Number(p.xp) || 0);
    p.points = Math.max(
      0,
      Number(p.points) || (src.expedition ? 0 : p.lvl - 1),
    );
    p.talents = {
      power: 0,
      focus: 0,
      vitality: 0,
      ...p.talents,
    };
    for (const t of TALENTS)
      p.talents[t.id] = clamp(
        Math.floor(Number(p.talents[t.id]) || 0),
        0,
        t.max,
      );
    p.hp = clamp(p.hp, 0, p.maxHp);
    p.mp = clamp(p.mp, 0, p.maxMp);
    p.alive = p.hp > 0;
  }
  for (const [z, m] of Object.entries(dst.expedition.missions)) {
    if (!SIDE_MISSIONS[z]) {
      delete dst.expedition.missions[z];
      continue;
    }
    m.nodes = [
      ...new Set(
        (Array.isArray(m.nodes) ? m.nodes : []).filter((i) =>
          [0, 1, 2].includes(i),
        ),
      ),
    ];
    m.complete = !!m.complete;
  }
  if (src.expedition?.version !== 6) {
    dst.player = {
      ...dst.player,
      ...MAPS[dst.zone].spawn,
      dir: "right",
    };
    dst.defeated = {};
    dst.expedition.version = 6;
  }
  dst.adventure.visited[dst.zone] = true;
}

function loadGame(show = true) {
  walkPath = [];
  walkTarget = null;
  modal = null;
  restoreSavedGame(show);
  if (mode === "world") encounterGrace = 3;
}

function startNewGame() {
  modal = null;
  walkPath = [];
  walkTarget = null;
  beginIntroduction();
  cutscene.pages[3].text =
    "Meet the rally witness on the Mall. Click to walk, or use WASD. The district atlas connects twelve areas; the garden offers your first side mission. Battles earn XP. P opens talents, and B opens auto-battle options.";
}

function migrateLegacy(data) {
  const s = freshState(),
    old = data?.state || {};
  if (old.party)
    s.party = old.party.map((p, i) =>
      Object.assign({}, s.party[i], {
        lvl: p.lvl || 3,
        xp: p.xp || 0,
        hp: p.hp || s.party[i].hp,
        maxHp: p.maxHp || s.party[i].maxHp,
        mp: p.mp || s.party[i].mp,
        maxMp: p.maxMp || s.party[i].maxMp,
        atk: p.atk || s.party[i].atk,
        def: p.def || s.party[i].def,
        mag: p.magic || p.mag || s.party[i].mag,
        limit: p.limit || 0,
        status: {},
      }),
    );
  s.inventory = Object.assign(s.inventory, old.inventory || {});
  s.cash = old.cash || s.cash;
  const f = old.flags || {};
  if (f.megaphoneFound) {
    s.flags.megaphone = true;
    s.mainStage = 3;
  }
  if (f.sentinelDefeated) {
    s.flags.sentinel = true;
    s.mainStage = 4;
  }
  if (f.ledgerFound) {
    s.flags.ledger = true;
    s.mainStage = 5;
  }
  if (f.fixerDefeated) {
    s.flags.fixer = true;
    s.mainStage = 5;
  }
  if (f.transcriptFound) {
    s.flags.transcript = true;
    s.mainStage = 6;
  }
  if (f.chairDefeated) {
    s.flags.chair = true;
    s.mainStage = 8;
  }
  if (f.finaleDone) {
    s.flags.ending = true;
    s.mainStage = 9;
  }
  s.zone =
    old.zone === "CAPITOL"
      ? "GROUNDS"
      : old.zone === "ARCHIVE"
        ? "ARCHIVE"
        : old.zone === "PRESS"
          ? "PRESS"
          : "MALL";
  s.player = Object.assign(s.player, old.player || {});
  return {
    version: VERSION,
    state: s,
  };
}
