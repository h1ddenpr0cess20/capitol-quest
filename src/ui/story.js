function drawCutscene() {
  drawHeadingBackdrop();
  const p = cutscene.pages[cutscene.i];
  box(65, 325, 1150, 325, "#0c172bef", "#617a95");
  if (p.portrait) {
    drawPortrait(p.portrait, 95, 365, 140, 174);
    pill(
      ROLES[p.portrait] || "PARTY",
      97,
      562,
      ACCENTS[p.portrait] || "#f8ce76",
    );
  }
  const x = p.portrait ? 270 : 105;
  text(p.speaker, x, 365, 18, "#f8ce76");
  wrapped(p.text, x, 414, p.portrait ? 880 : 1030, 22, "#eef2f8", 6);
  panelText(
    `${cutscene.i + 1} / ${cutscene.pages.length}`,
    105,
    612,
    14,
    "#92a6be",
  );
  uiButton("Continue →", 1010, 578, 170, 47, () => handleInput("enter"));
}

function drawDialogue() {
  ctx.fillStyle = "#050b1733";
  ctx.fillRect(0, 0, W, H);
  box(38, 370, 1204, 324, "#0c172bf7", "#70849b");
  if (dialogue.portrait) drawPortrait(dialogue.portrait, 65, 405, 130, 162);
  const x = dialogue.portrait ? 225 : 74;
  text(dialogue.speaker, x, 405, 22, "#f8ce76");
  wrapped(
    dialogue.lines[dialogue.i],
    x,
    450,
    dialogue.portrait ? 950 : 1100,
    21,
    "#eef3fb",
    5,
  );
  panelText(
    `${dialogue.i + 1} / ${dialogue.lines.length}`,
    74,
    650,
    14,
    "#9bafc7",
  );
  uiButton("Continue →", 1030, 628, 175, 45, () => handleInput("enter"));
}

function drawStoryJournal() {
  modalFrame("CASE JOURNAL", "The record, the route, and what remains.");
  const q = MAIN_STAGES[state.mainStage];
  box(58, 168, 715, 157, "#1c2c43", "#688199");
  pill("CHAPTER " + state.chapter, 78, 184, "#95bedc");
  text(q.title, 78, 222, 26, "#f8ce76");
  wrapped(getObjective()?.label || q.desc, 78, 266, 660, 17, "#c3d2e4", 2);
  text("EVIDENCE CHAIN", 822, 178, 16, "#8fbedc");
  [
    ["Relay key", state.flags.megaphone],
    ["Red Ledger", state.flags.ledger],
    ["Source transcript", state.flags.transcript],
    ["Verification", state.flags.factChecked],
    ["Public record", state.flags.ending],
  ].forEach(([s, done], i) => {
    panelText(
      done ? "✓" : "○",
      828,
      220 + i * 47,
      19,
      done ? "#95deb8" : "#617892",
    );
    panelText(s, 860, 222 + i * 47, 17, done ? "#e5eef7" : "#9badc2");
  });
  text("RECENT PROGRESS", 58, 358, 15, "#8fbedc");
  state.log
    .slice(0, 5)
    .forEach((l, i) =>
      wrapped(l.text, 58, 393 + i * 45, 710, 14, "#aebfd4", 2),
    );
  const voices = Object.values(state.witnesses).filter(Boolean).length;
  panelText(
    "Five voices: " + Math.min(5, voices) + "/5",
    825,
    503,
    16,
    "#f8ce76",
  );
  panelText(
    "Clean backups: " + state.evidence.usb + "/4",
    825,
    539,
    16,
    "#94cce7",
  );
  panelText(
    "Supply caches: " + Object.keys(adv().chests).length + "/6",
    825,
    575,
    16,
    "#95deb8",
  );
}

function drawEnding() {
  drawHeadingBackdrop();
  box(45, 40, 1190, 640, "#0c172bf5", "#698198");
  topLabel("THE COMPLETE RECORD", "The final decision");
  if (ending.step === "choice") {
    wrapped(
      "The source trail is verified. The hearing is over. Decide how the complete record reaches the public.",
      58,
      170,
      1130,
      24,
      "#d5e1ee",
      3,
    );
    [
      [
        "BROADCAST NOW",
        "Release the complete source package immediately, with the corrections attached.",
      ],
      [
        "FILE WITH THE HEARING",
        "Enter the package into the hearing record before the public relay opens.",
      ],
    ].forEach((o, i) =>
      uiButton(
        i + 1 + " · " + o[0],
        60,
        340 + i * 124,
        1158,
        104,
        () => {
          ending.choice = i;
          endingInput("enter");
        },
        {
          active: ending.choice === i,
          sub: o[1],
        },
      ),
    );
  } else {
    wrapped(endingPages()[ending.page], 60, 210, 1120, 27, "#eef2f8", 7);
    panelText(
      "Evidence USBs " +
        state.evidence.usb +
        "/4 · Witnesses " +
        Object.values(state.witnesses).filter(Boolean).length +
        " · Encounters won " +
        adv().battles,
      60,
      543,
      16,
      "#95bedb",
    );
    uiButton("Continue →", 875, 597, 327, 53, () => endingInput("enter"), {
      active: true,
    });
  }
}

function drawQuestOverlay() {
  drawStoryJournal();
  box(811, 568, 405, 85, "#173b43", "#567983");
  panelText(
    "Side missions " +
      Object.values(state.expedition.missions).filter((m) => m.complete)
        .length +
      "/6  ·  Caches " +
      Object.keys(adv().chests).length +
      "/12",
    828,
    582,
    12,
    UI_GOLD,
  );
  uiButton("Open district atlas →", 828, 608, 369, 34, () => {
    overlay = "map";
    atlasTab = "districts";
  });
}
