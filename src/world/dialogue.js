function checkServiceClues() {
  if (
    state.flags.veteranClue &&
    state.flags.teacherClue &&
    state.mainStage === 1
  )
    setStage(2);
}

function collectEvidence(id, kind) {
  state.opened[id] = true;
  state.evidence.usb++;
  state.inventory.SUPER++;
  state.cash += 40;
  notify(`EVIDENCE USB ${state.evidence.usb}/4  +SUPER POTION`);
  log(`Recovered evidence USB ${state.evidence.usb}/4.`);
  if (state.evidence.usb === 4) {
    state.cash += 220;
    state.inventory.MEDKIT += 2;
    notify("SIDE QUEST COMPLETE: CLEAN BACKUPS  +220 CASH");
  }
}

function startStoryScene(pages, onDoneText = "") {
  mode = "cutscene";
  cutscene = {
    i: 0,
    pages,
    onDone: () => {
      mode = "world";
      if (onDoneText) notify(onDoneText);
      saveGame(false);
    },
  };
}

function markWitness(id) {
  if (id in state.witnesses && !state.witnesses[id]) {
    state.witnesses[id] = true;
    const n = Object.values(state.witnesses).filter(Boolean).length;
    if (n === 5) {
      state.cash += 120;
      state.inventory.SUPER++;
      notify("SIDE QUEST: FIVE VOICES COMPLETE  +120 CASH");
      log("Side quest complete: Five Voices.");
    }
  }
}

function startDialogue(n) {
  const id = n.id;
  let lines = [];
  let onDone = null;
  markWitness(id);
  if (id === "protester") {
    if (state.mainStage === 0) {
      lines = [
        "The megaphone vanished when the service cart rolled east.",
        "Do not trust the loudest version of the story. Ask the Veteran and the Teacher; both saw different parts of the route.",
      ];
      onDone = () => {
        setStage(1);
        checkServiceClues();
      };
    } else
      lines = [
        "The rally can wait. Bring back the authentication key and the complete record.",
      ];
  } else if (id === "veteran") {
    lines = [
      "I saw the cart leave by the south service lane.",
      "The megaphone was still on it when it passed the fountain. The driver stopped near the Capitol maintenance yard.",
    ];
    onDone = () => {
      state.flags.veteranClue = true;
      checkServiceClues();
    };
  } else if (id === "teacher") {
    lines = [
      "A student photographed the cart tag before it left: maintenance route C-4.",
      "That route ends at the Capitol service yard. The route number and the Veteran's sighting should be enough to find it.",
    ];
    onDone = () => {
      state.flags.teacherClue = true;
      checkServiceClues();
    };
  } else if (id === "student") {
    lines = [
      "I sent the route photo to the public archive before my battery died.",
      "If the archive copy and the service log disagree, keep both. Differences are evidence too.",
    ];
  } else if (id === "nurse") {
    lines = [
      "Take a breather. I can get everyone back on their feet.",
      "Your HP and MP are restored. Medkits can revive a fallen ally in battle; open Party & Supplies to use items on the road.",
    ];
    onDone = () => {
      state.party.forEach((p) => {
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        p.alive = true;
        p.status = {};
      });
      notify("PARTY FULLY RESTORED");
    };
  } else if (id === "vendor") {
    openShop();
    return;
  } else if (id === "gateOfficer") {
    lines = state.flags.megaphone
      ? [
          "The key in that megaphone matches the visitor relay.",
          "The interior checkpoint is still locked by the Sentinel. Use the north doors.",
        ]
      : [
          "Visitor access is open, but the relay key is missing.",
          "Check the maintenance yard before entering.",
        ];
  } else if (id === "scientist") {
    lines = [
      "The bad record is not random corruption. The edits follow a chain.",
      "If you find the Red Ledger, compare its hand-off codes with the broadcast transcript.",
    ];
  } else if (id === "civilian")
    lines = [
      "The east lawn is quieter. That makes it easier to spot the maintenance cart.",
    ];
  else if (id === "clerk")
    lines = [
      "The Sentinel locked the archive passage when the relay key disappeared.",
      "Defeat it and the east passage should reopen.",
    ];
  else if (id === "guard2")
    lines = [
      "The rotunda checkpoint is north. The archive passage is east of the dais.",
    ];
  else if (id === "archivist") {
    lines = state.flags.sentinel
      ? [
          "The Red Ledger is in the secured reading room.",
          "Take the original. The broadcast center will need its chain-of-custody stamps.",
        ]
      : [
          "The archive passage is sealed until the Capitol checkpoint is restored.",
        ];
  } else if (id === "journalist")
    lines = [
      "A clipped quote can be true and still hide the meaning of the full exchange.",
      "The source transcript at the broadcast center is the only clean comparison copy.",
    ];
  else if (id === "organizer")
    lines = [
      "People disagree about the conclusion. They should still be able to inspect the same record.",
    ];
  else if (id === "editor") {
    lines = state.flags.fixer
      ? [
          "The Fixer is out of the control room.",
          "The source locker is unlocked now. Take the original transcript to the Fact Checker.",
        ]
      : [
          "Someone in the control room keeps replacing the queued transcript with a cut version.",
          "Stop the Fixer first; then I can unlock the source copy.",
        ];
  } else if (id === "factchecker") {
    if (state.flags.ledger && state.flags.transcript) {
      lines = [
        "The ledger and transcript match at every verified hand-off except one: the hearing chamber queue.",
        "That is enough to establish the chain. I am signing the verification card now.",
        "Take the complete record to the hearing.",
      ];
      onDone = () => {
        state.flags.factChecked = true;
        setStage(7);
      };
    } else
      lines = [
        "I need both originals: the Red Ledger and the source transcript.",
        "Without both, we can spot a mismatch but cannot prove the chain.",
      ];
  } else if (id === "producer")
    lines = [
      "The hearing feed is on the upper channel. Once the Fact Checker signs off, the chamber door will open.",
    ];
  else if (id === "marshal")
    lines = state.flags.factChecked
      ? [
          "Verification card accepted. The hearing is live.",
          "The Committee Chair is at the dais.",
        ]
      : ["The chamber is closed until the record is verified."];
  else if (id === "observer")
    lines = [
      "Whatever you decide after the hearing, leave the source trail intact.",
    ];
  dialogue = {
    speaker: n.name,
    portrait: n.portrait,
    lines,
    i: 0,
    onDone,
  };
  mode = "dialogue";
  sfx("confirm");
}

function openShop() {
  shop = {
    selected: 0,
  };
  mode = "shop";
  sfx("confirm");
}

function startEnding() {
  if (!state.flags.chair) return;
  mode = "ending";
  ending = {
    step: "choice",
    choice: 0,
    page: 0,
  };
  sfx("confirm");
}

function endingPages() {
  if (state.endingChoice === 0)
    return [
      "The complete source package goes live with the ledger, transcript, verification card, and every correction attached.",
      "The first hour is chaotic. People argue about the meaning, but they are finally arguing from the same record.",
      "The Civic Relay stays online as an open archive. The team leaves the chamber with one rule intact: source first, conclusion second.",
    ];
  return [
    "The complete source package is entered into the public hearing record before the broadcast begins.",
    "The delay frustrates the crowd, but the chain of custody survives every challenge placed on it.",
    "When the broadcast finally opens, it carries the hearing record beside the source. The team leaves with one rule intact: preserve the trail.",
  ];
}
