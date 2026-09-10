function interact() {
  const q = nearestInteraction();
  if (q) {
    if (q.kind === "npc") startDialogue(q.data);
    else q.data.run();
    return;
  }
  notify("NOTHING TO INTERACT WITH HERE", 1.2);
}

function storyInteractables() {
  const z = state.zone,
    arr = [];
  if (z === "MALL") {
    arr.push({
      id: "toGrounds",
      x: 2070,
      y: 810,
      label: "Capitol Grounds",
      run: () =>
        zoneTransition("GROUNDS", {
          x: 160,
          y: 990,
        }),
    });
    arr.push({
      id: "usbMall",
      x: 1760,
      y: 1190,
      label: "Evidence USB",
      hidden: () => state.opened.usbMall,
      icon: "USB",
      run: () => collectEvidence("usbMall", "USB"),
    });
  } else if (z === "GROUNDS") {
    arr.push({
      id: "toMall",
      x: 110,
      y: 1030,
      label: "National Mall",
      run: () =>
        zoneTransition("MALL", {
          x: 2020,
          y: 810,
        }),
    });
    arr.push({
      id: "megaphone",
      x: 610,
      y: 940,
      label: "Service Cart",
      hidden: () => state.flags.megaphone,
      icon: "MEGA",
      run: () => {
        if (state.mainStage < 2) {
          notify("YOU NEED BOTH SERVICE-ROUTE CLUES FIRST");
          sfx("error");
          return;
        }
        state.flags.megaphone = true;
        state.cash += 75;
        setStage(3);
        log("Recovered the relay key inside the megaphone.");
        notify("MEGAPHONE + RELAY KEY RECOVERED  +75 CASH");
        sfx("save");
      },
    });
    arr.push({
      id: "toRotunda",
      x: 980,
      y: 650,
      label: "Capitol Doors",
      run: () => {
        if (!state.flags.megaphone) {
          notify("THE RELAY KEY IS STILL MISSING");
          sfx("error");
          return;
        }
        zoneTransition("ROTUNDA", {
          x: 810,
          y: 1030,
        });
      },
    });
    arr.push({
      id: "usbGrounds",
      x: 1690,
      y: 1210,
      label: "Evidence USB",
      hidden: () => state.opened.usbGrounds,
      icon: "USB",
      run: () => collectEvidence("usbGrounds", "USB"),
    });
  } else if (z === "ROTUNDA") {
    arr.push({
      id: "toGrounds",
      x: 810,
      y: 1060,
      label: "Capitol Grounds",
      run: () =>
        zoneTransition("GROUNDS", {
          x: 980,
          y: 720,
        }),
    });
    arr.push({
      id: "sentinel",
      x: 810,
      y: 400,
      label: "Capitol Sentinel",
      hidden: () => state.flags.sentinel,
      run: () =>
        startBattle(
          [
            {
              type: "SENTINEL",
              level: 5,
            },
          ],
          {
            gold: 430,
            label: "CAPITOL SENTINEL",
            boss: "SENTINEL",
          },
        ),
    });
    arr.push({
      id: "toArchive",
      x: 1460,
      y: 820,
      label: "Archive Passage",
      run: () => {
        if (!state.flags.sentinel) {
          notify("THE SENTINEL STILL CONTROLS THIS PASSAGE");
          sfx("error");
          return;
        }
        zoneTransition("ARCHIVE", {
          x: 170,
          y: 1070,
        });
      },
    });
  } else if (z === "ARCHIVE") {
    arr.push({
      id: "toRotunda",
      x: 110,
      y: 1080,
      label: "Capitol Interior",
      run: () =>
        zoneTransition("ROTUNDA", {
          x: 1450,
          y: 820,
        }),
    });
    arr.push({
      id: "ledger",
      x: 950,
      y: 860,
      label: "Red Ledger",
      hidden: () => state.flags.ledger,
      icon: "FILE",
      run: () => {
        if (!state.flags.sentinel) {
          notify("THE VAULT IS STILL SEALED");
          return;
        }
        state.flags.ledger = true;
        state.evidence.files++;
        state.cash += 120;
        setStage(5);
        notify("RED LEDGER SECURED  +120 CASH");
        sfx("save");
      },
    });
    arr.push({
      id: "toPress",
      x: 1740,
      y: 1030,
      label: "Broadcast Center",
      run: () => {
        if (!state.flags.ledger) {
          notify("THE SOURCE CHAIN IS INCOMPLETE — FIND THE LEDGER");
          sfx("error");
          return;
        }
        zoneTransition("PRESS", {
          x: 160,
          y: 1010,
        });
      },
    });
    arr.push({
      id: "usbArchive",
      x: 1600,
      y: 940,
      label: "Evidence USB",
      hidden: () => state.opened.usbArchive,
      icon: "USB",
      run: () => collectEvidence("usbArchive", "USB"),
    });
  } else if (z === "PRESS") {
    arr.push({
      id: "toArchive",
      x: 105,
      y: 1010,
      label: "Public Archive",
      run: () =>
        zoneTransition("ARCHIVE", {
          x: 1720,
          y: 1030,
        }),
    });
    arr.push({
      id: "fixer",
      x: 1510,
      y: 650,
      label: "Media Fixer",
      hidden: () => state.flags.fixer,
      run: () =>
        startBattle(
          [
            {
              type: "FIXER",
              level: 6,
            },
          ],
          {
            gold: 670,
            label: "MEDIA FIXER",
            boss: "FIXER",
          },
        ),
    });
    arr.push({
      id: "transcript",
      x: 840,
      y: 690,
      label: "Source Locker",
      hidden: () => state.flags.transcript,
      icon: "DOC",
      run: () => {
        if (!state.flags.fixer) {
          notify("THE SOURCE LOCKER IS STILL UNDER FIXER CONTROL");
          sfx("error");
          return;
        }
        state.flags.transcript = true;
        state.evidence.files++;
        setStage(6);
        notify("SOURCE TRANSCRIPT RECOVERED");
        sfx("save");
      },
    });
    arr.push({
      id: "toHearing",
      x: 1630,
      y: 1000,
      label: "Hearing Chamber",
      run: () => {
        if (!state.flags.factChecked) {
          notify("FACT CHECKER SIGN-OFF REQUIRED");
          sfx("error");
          return;
        }
        zoneTransition("HEARING", {
          x: 730,
          y: 950,
        });
      },
    });
    arr.push({
      id: "usbPress",
      x: 1290,
      y: 1030,
      label: "Evidence USB",
      hidden: () => state.opened.usbPress,
      icon: "USB",
      run: () => collectEvidence("usbPress", "USB"),
    });
  } else if (z === "HEARING") {
    arr.push({
      id: "toPress",
      x: 730,
      y: 1000,
      label: "Broadcast Center",
      run: () =>
        zoneTransition("PRESS", {
          x: 1600,
          y: 1000,
        }),
    });
    arr.push({
      id: "chair",
      x: 730,
      y: 430,
      label: "Committee Chair",
      hidden: () => state.flags.chair,
      run: () =>
        startBattle(
          [
            {
              type: "CHAIR",
              level: 7,
            },
          ],
          {
            gold: 1000,
            label: "FINAL HEARING",
            boss: "CHAIR",
          },
        ),
    });
    arr.push({
      id: "record",
      x: 730,
      y: 430,
      label: "Public Record",
      hidden: () => !state.flags.chair || state.flags.ending,
      icon: "DOC",
      run: startEnding,
    });
  }
  return arr;
}

function useFieldItem(key, target) {
  const item = ITEMS[key];
  if (!state.inventory[key])
    return notify("NO " + item.name.toUpperCase() + " LEFT");
  if (!target.alive && !item.revive)
    return notify("USE A MEDKIT TO REVIVE THIS ALLY");
  if (
    (item.heal && target.hp === target.maxHp) ||
    (item.mp && target.mp === target.maxMp)
  )
    return notify("ALREADY FULL");
  state.inventory[key]--;
  if (item.heal) {
    target.hp = Math.min(target.maxHp, target.hp + item.heal);
    target.alive = target.hp > 0;
  }
  if (item.mp) target.mp = Math.min(target.maxMp, target.mp + item.mp);
  sfx("heal");
  saveGame(false);
}

function adventureInteractables() {
  const arr = storyInteractables(),
    a = adv(),
    z = state.zone;
  const rest = REST[z];
  arr.push({
    id: "rest",
    ...rest,
    label: "Rest & save",
    run: () => {
      state.party.forEach((p) => {
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        p.alive = true;
        p.status = {};
      });
      saveGame(false);
      notify("HP & MP RESTORED · PROGRESS SAVED");
      sfx("heal");
    },
  });
  if (z === "MALL") {
    arr.push({
      id: "upgrade",
      x: 600,
      y: 1190,
      label: "Party training",
      icon: "FILE",
      run: () => {
        modal = {
          type: "upgrade",
          selection: 0,
        };
      },
    });
    arr.push({
      id: "tutorial",
      x: 750,
      y: 1160,
      label: "Practice encounter",
      run: () =>
        startBattle(
          [
            {
              type: "PROTESTER",
              level: 2,
            },
          ],
          {
            gold: 0,
            practice: true,
            label: "PRACTICE · Learn to break an enemy",
          },
        ),
    });
  }
  if (z === "GROUNDS") {
    BREAKERS.forEach((b, i) =>
      arr.push({
        id: "breaker" + i,
        ...b,
        label: "Relay switch " + (i + 1),
        run: () => {
          if (a.breakers.includes(i)) {
            notify("SWITCH ALREADY POWERED");
            return;
          }
          a.breakers.push(i);
          notify(`RELAY POWER ${a.breakers.length}/3`);
          sfx("save");
          saveGame(false);
        },
      }),
    );
    const cart = arr.find((i) => i.id === "megaphone"),
      run = cart.run;
    cart.run = () => {
      if (a.breakers.length < 3) {
        notify(
          "RESTORE THE THREE RELAY SWITCHES · " + a.breakers.length + "/3",
        );
        return;
      }
      run();
      saveGame(false);
    };
  }
  if (z === "ARCHIVE") {
    CATALOG.forEach((c, i) =>
      arr.push({
        id: "catalog" + i,
        ...c,
        hidden: () => a.catalog.includes(i),
        label: c.label,
        run: () => {
          a.catalog.push(i);
          notify("CATALOG CARD FOUND · " + c.label.toUpperCase());
          saveGame(false);
        },
      }),
    );
    const ledger = arr.find((i) => i.id === "ledger"),
      run = ledger.run;
    ledger.run = () => {
      if (!a.archiveOpen) {
        modal = {
          type: "archive",
          selection: 0,
        };
        return;
      }
      run();
      saveGame(false);
    };
  }
  if (z === "PRESS") {
    arr.push({
      id: "channel",
      x: 1215,
      y: 710,
      label: "Tune relay channel",
      icon: "USB",
      run: () => {
        modal = {
          type: "channel",
          selection: 0,
        };
      },
    });
    const fixer = arr.find((i) => i.id === "fixer"),
      run = fixer.run;
    fixer.run = () => {
      if (!a.channelOpen) {
        notify("THE CONTROL ROOM IS JAMMED · TUNE THE RELAY FIRST");
        return;
      }
      run();
    };
  }
  if (z === "HEARING") {
    [
      {
        x: 415,
        y: 480,
        label: "Submit source originals",
      },
      {
        x: 1030,
        y: 480,
        label: "Submit verification card",
      },
    ].forEach((p, i) =>
      arr.push({
        id: "brief" + i,
        ...p,
        hidden: () => a.briefs.includes(i),
        icon: "DOC",
        run: () => {
          if (!state.flags.factChecked) {
            notify("GET FACT CHECKER SIGN-OFF FIRST");
            return;
          }
          a.briefs.push(i);
          notify("HEARING EVIDENCE FILED · " + a.briefs.length + "/2");
          saveGame(false);
        },
      }),
    );
    const chair = arr.find((i) => i.id === "chair"),
      run = chair.run;
    chair.run = () => {
      if (a.briefs.length < 2) {
        notify("FILE BOTH EVIDENCE PACKAGES AT THE SIDE DESKS");
        return;
      }
      run();
    };
  }
  const caches = {
    MALL: {
      x: 190,
      y: 570,
    },
    GROUNDS: {
      x: 1790,
      y: 280,
    },
    ROTUNDA: {
      x: 1140,
      y: 410,
    },
    ARCHIVE: {
      x: 1100,
      y: 860,
    },
    PRESS: {
      x: 1330,
      y: 520,
    },
    HEARING: {
      x: 200,
      y: 880,
    },
  };
  if (caches[z])
    arr.push({
      id: "cache",
      ...caches[z],
      icon: "FILE",
      label: "Supply cache",
      hidden: () => a.chests[z],
      run: () => {
        a.chests[z] = true;
        state.cash += 65;
        state.inventory.SERUM++;
        state.inventory.MEDKIT++;
        notify("CACHE · +65 CASH · SERUM · MEDKIT");
        saveGame(false);
      },
    });
  return arr;
}

function sideState(z) {
  return (
    state.expedition.missions[z] ||
    (state.expedition.missions[z] = {
      nodes: [],
      complete: false,
    })
  );
}

function restoreParty() {
  state.party.forEach((p) => {
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    p.alive = true;
    p.status = {};
    p.guard = false;
  });
}

function interactables() {
  const z = state.zone,
    d = DISTRICTS[z],
    side = SIDE_MISSIONS[z];
  let arr = [];
  if (!side) {
    arr = adventureInteractables();
    for (const it of arr) {
      const pos = LOCATIONS[z]?.[it.id];
      if (pos) {
        it.x = pos[0];
        it.y = pos[1];
      }
      const match = {
        toMall: "MALL",
        toGrounds: "GROUNDS",
        toRotunda: "ROTUNDA",
        toArchive: "ARCHIVE",
        toPress: "PRESS",
        toHearing: "HEARING",
      }[it.id];
      if (match) {
        it.travel = match;
        it.run = () => {
          if (!isZoneUnlocked(match)) {
            notify("FOLLOW THE GOLD STORY OBJECTIVE FIRST");
            return;
          }
          zoneTransition(match);
        };
      }
    }
    for (const [child, m] of Object.entries(SIDE_MISSIONS))
      if (m.parent === z) arr.push(departure(z, child, 260, 420));
  } else {
    const s = sideState(z);
    arr.push(departure(z, side.parent, 140, 1040));
    const spots = d.nodes;
    spots.forEach(([x, y], i) =>
      arr.push({
        id: "mission_" + i,
        x,
        y,
        label: side.items[i],
        icon: "FILE",
        hidden: () => s.nodes.includes(i),
        run: () => {
          if (s.nodes.includes(i)) return;
          if (z === "RECORDS" && i !== s.nodes.length) {
            notify("STAMP IN ORDER: INTAKE → TRANSFER → RELEASE");
            return;
          }
          s.nodes.push(i);
          grantPartyXP(40 + d.level * 5);
          notify(side.verb.toUpperCase() + " · " + s.nodes.length + "/3");
          saveGame(false);
        },
      }),
    );
    arr.push({
      id: "mission_boss",
      x: d.boss[0],
      y: d.boss[1],
      label: s.complete ? "Mission complete" : ENEMY_DEFS[side.boss].label,
      hidden: () => s.complete,
      boss: true,
      run: () => {
        if (s.nodes.length < 3) {
          notify(side.verb.toUpperCase() + " · " + s.nodes.length + "/3");
          return;
        }
        startBattle(
          [
            {
              type: z === "VAULT" ? "SENTINEL" : side.boss,
              level: d.level,
            },
          ],
          {
            boss: side.boss,
            mission: z,
            wave: 0,
            gold: 180 + d.level * 35,
            label: side.title.toUpperCase(),
          },
        );
      },
    });
    arr.push({
      id: "briefing",
      x: 400,
      y: 1040,
      label: "Mission briefing",
      icon: "DOC",
      run: () => {
        modal = {
          type: "mission",
          zone: z,
        };
      },
    });
    arr.push({
      id: "cache",
      x: d.cache?.[0] || 1700,
      y: d.cache?.[1] || 940,
      label: "Supply cache",
      icon: "FILE",
      hidden: () => adv().chests[z],
      run: () => {
        adv().chests[z] = true;
        state.cash += 80;
        state.inventory.SERUM += 2;
        state.inventory.MEDKIT++;
        notify("CACHE · +80 CASH · 2 SERUM · MEDKIT");
        saveGame(false);
      },
    });
  }
  arr = arr.filter((i) => i.id !== "rest");
  arr.push({
    id: "rest",
    ...REST[z],
    label: "Rest & save",
    icon: "MEDKIT",
    run: () => {
      restoreParty();
      adv().visited[z] = true;
      saveGame(false);
      notify("PARTY RESTORED · FAST TRAVEL UNLOCKED");
      sfx("heal");
    },
  });
  arr.push({
    id: "travel",
    x: d.rest[0] + 125,
    y: d.rest[1],
    label: "District atlas / fast travel",
    run: () => {
      atlasTab = "districts";
      atlasSelection = z;
      overlay = "map";
    },
  });
  if (z === "MALL")
    arr.push({
      id: "trials",
      x: 840,
      y: 1080,
      label: "Challenge board",
      icon: "DOC",
      run: () =>
        (modal = {
          type: "trials",
          selection: 0,
        }),
    });
  for (const it of arr) {
    const action = it.run;
    it.run = () => {
      if (!it.hidden?.()) action();
    };
  }
  return arr;
}

function nearestInteraction() {
  const p = state.player;
  let best = null,
    bestD = 84;
  for (const n of npcList()) {
    const d = Math.hypot(p.x - n.x, p.y - n.y);
    if (d < bestD) {
      bestD = d;
      best = {
        kind: "npc",
        data: n,
      };
    }
  }
  for (const it of interactables()) {
    if (it.hidden?.()) continue;
    const d = Math.hypot(p.x - it.x, p.y - it.y);
    if (d < bestD) {
      bestD = d;
      best = {
        kind: "object",
        data: it,
      };
    }
  }
  return best;
}
