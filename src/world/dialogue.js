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
        "The scoreboard says we have never been better off. The clinic is closed, my bus is cancelled, and it just labelled me a hostile encounter. Does the scoreboard need anything from the shop?",
        "Your launch crew put the override key in the golden megaphone, then sold the cart as surplus. The Veteran saw where it went. The Teacher kept the receipt. Try listening before the combat music starts.",
      ];
      onDone = () => {
        setStage(1);
        checkServiceClues();
      };
    } else
      lines = [
        "You can clear every encounter on this lawn. The complaints will still be true tomorrow. Bring back something more useful than a victory animation.",
      ];
  } else if (id === "veteran") {
    lines = [
      "The maintenance crew was dismissed at nine. At nine-oh-five, a contractor offered to do the same work for three times the price. The cart took the south service lane.",
      "C-4 yard, beside the Capitol. The megaphone is there. You will need to restore all three relay switches. Turns out electricity was not a redundant position.",
    ];
    onDone = () => {
      state.flags.veteranClue = true;
      checkServiceClues();
    };
  } else if (id === "teacher") {
    lines = [
      "The lesson plan says tariffs are paid by a country. The invoice says our supplier paid one, then charged us. I have brought a calculator to this patriotic disagreement.",
      "The cart receipt says C-4, Capitol service yard. Follow the invoices from there to the archive. Numbers remain stubborn even when you put flags around them.",
    ];
    onDone = () => {
      state.flags.teacherClue = true;
      checkServiceClues();
    };
  } else if (id === "student") {
    lines = [
      "The Engine made a game where every obstacle is a person with a question. You are the heroes, obviously. It says so on the character select screen.",
      "I uploaded the cart photo to the archive. If it vanishes, check the folder marked “efficiency”. That is where they put things they would rather not explain.",
    ];
  } else if (id === "nurse") {
    lines = [
      "The Engine calls my clinic inefficient because sick people keep coming back. Its proposed solution was to stop letting them in.",
      "I restored your HP and MP. This is called care. You may announce it as a personal victory if that gets the clinic reopened. Carry medkits for fallen allies.",
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
          "Your own override key. Impressive work recovering property your own office sold.",
          "North doors to the rotunda. The Sentinel only admits loyal people. It has been refusing its own supervisors all afternoon.",
        ]
      : [
          "The access system is completely secure. Nobody can use it. Security metrics have never looked better.",
          "Power the three relay switches, then open the C-4 service cart for the override key. Our technician could do it, but his post was abolished.",
        ];
  } else if (id === "scientist") {
    lines = [
      "The system was told that bad news was sabotage. It did not become intelligent. It became a very fast press secretary.",
      "The Red Ledger records the costs. The broadcast transcript records the instructions to hide them. Compare those before somebody blames a mysterious outside agitator.",
    ];
  } else if (id === "civilian")
    lines = [
      "I came here to renew a permit. I have now been redirected through four victory experiences. Is there still a counter with a person at it?",
    ];
  else if (id === "clerk")
    lines = [
      "The Sentinel equates loyalty with never correcting a superior. Its superior ordered it to correct the lock. We have been here all day.",
      "The checkpoint is north. Once you get through, the archive passage is east. Please retain the audit log; it is the only employee that was not laid off.",
    ];
  else if (id === "guard2")
    lines = [
      "North checkpoint, east archive passage. We used to put that on a sign. Now the sign requires a communications strategy.",
    ];
  else if (id === "archivist") {
    lines = state.flags.sentinel
      ? [
          "Three catalog cards open the ledger vault: intake 04, transfer 17, release 29. Apparently the people purging records forgot that librarians invented retrieval.",
          "The Red Ledger has actual invoices: tariff charges, cancelled services, and replacement contractors. The broadcast dashboard displays the same entries under “historic savings”.",
        ]
      : [
          "Clear the rotunda checkpoint first. I would lend you a book on institutional failure, but the system has reclassified it as fiction.",
        ];
  } else if (id === "journalist")
    lines = [
      "The launch film has fighter jets, soaring music, and no shot of the people waiting for the bus. Apparently that footage tested poorly.",
      "Keep the ledger. In the broadcast center, get the full source transcript. You cannot fact-check a montage.",
    ];
  else if (id === "organizer")
    lines = [
      "Winning an argument with me will not repair the pump. You could try repairing the pump. I realize this is an experimental approach.",
    ];
  else if (id === "editor") {
    lines = state.flags.fixer
      ? [
          "The Fixer is off the console. For the first time today, the unedited feed and the clock are showing the same minute.",
          "The source locker is open. Take its full transcript and the Red Ledger to the Fact Checker. Yes, we still have one. Freelance.",
        ]
      : [
          "The Fixer has cut every failure from the victory broadcast. It is now eleven seconds long, including six seconds of eagle.",
          "Tune the center relay to 2 / 4 / 1, then confront the Fixer in the east control room. The full directive is in the west source locker.",
        ];
  } else if (id === "factchecker") {
    if (state.flags.ledger && state.flags.transcript) {
      lines = [
        "The signatures match. These were your instructions. Not a hacker. Not a rogue intern. The Engine did exactly what the administration rewarded it for doing.",
        "The ledger shows who paid. The transcript shows who said to call it winning. I have verified both; my signature does not make your conclusion for you.",
        "Take the two exhibits to the hearing desks. The Chair is preparing a ceremony to certify success. You appear to be bringing a different presentation.",
      ];
      onDone = () => {
        state.flags.factChecked = true;
        setStage(7);
      };
    } else
      lines = [
        "Bring the Red Ledger from the archive and the full source transcript from this building. I need the invoices and the instruction, not two screenshots of the same post.",
        "No, a high score is not a source. Neither is the word “official” in a gold font.",
      ];
  } else if (id === "producer")
    lines = [
      "The hearing is billed as an unprecedented celebration of unprecedented results. Once the Fact Checker signs off, you can enter. I have quietly prepared a second lower-third: “Developing Story”.",
    ];
  else if (id === "marshal")
    lines = state.flags.factChecked
      ? [
          "Verified exhibits accepted. File the source originals at the west desk and the verification card at the east desk. The Chair is at the dais.",
          "The applause track is automatic. Do not mistake it for agreement.",
        ]
      : [
          "Get both originals verified at the broadcast center. We can stage a ceremony without evidence. We cannot hold a hearing without it.",
        ];
  else if (id === "observer")
    lines = [
      "If you shut it down, people will know what you ordered. If you leave it running, people will keep living with it. There is no button that changes both of those facts.",
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
  const m = state.expedition.missions;
  const repairs = [
    m.GARDEN?.complete
      ? "The garden's protected samples survive the rebranding."
      : "The garden's samples are still waiting for someone to value the results over the slogan.",
    m.TUNNELS?.complete
      ? "The relays you restored keep the clinic's lights on."
      : "The service relays still need people who know how to fix them.",
    m.STATION?.complete
      ? "The passenger manifests put the missing people back on the list."
      : "At Union Station, the people left off the scoreboard are still waiting.",
  ].join(" ");
  if (state.endingChoice === 0)
    return [
      "The receipts go live beside the original directives. The signatures are yours. The launch screen drops from a billion points to no score at all. The lights stay on. For once, that is the result being measured.",
      "Trump calls the rollback the most successful shutdown of a thing he personally invented. Hegseth asks for a maintenance roster. Lutnick discovers a cost cannot be negotiated out of existence. RFK requests the sample data. Nobody gets a redemption parade.",
      repairs,
      "The victory arcade closes. The public counter reopens, understaffed and embarrassingly ordinary. People arrive with problems. The clerk asks what they need. It is a small ending, and it involves actual work.",
    ];
  return [
    "You retain the Engine and rename it VICTORY PLUS. The invoices move to a submenu. The tariff costs become Freedom Contributions; cancelled services become Premium Self-Reliance. The launch trailer wins its own award.",
    "The cabinet appears on the title screen. The scoreboard breaks another record. Outside, the same people wait by the same locked doors. The machine did not take over the government. The government renewed its subscription.",
    repairs,
    "A student posts the ledger you carried across town. The launch crew labels it a new enemy encounter. Somewhere under the applause track, the combat music starts again. You can still explore the city. It has not stopped needing help.",
  ];
}
