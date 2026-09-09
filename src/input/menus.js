function titleInput(k) {
  if (overlay === "controls") {
    if (k === "escape" || k === "enter" || k === " ") {
      overlay = null;
      sfx("cancel");
    }
    return;
  }
  const options = getTitleOptions();
  if (k === "arrowup" || k === "w") {
    titleSelection = (titleSelection + options.length - 1) % options.length;
    sfx("move");
  } else if (k === "arrowdown" || k === "s") {
    titleSelection = (titleSelection + 1) % options.length;
    sfx("move");
  } else if (k === "enter" || k === " ") {
    const opt = options[titleSelection];
    if (opt.disabled) {
      sfx("error");
      return;
    }
    sfx("confirm");
    opt.run();
  }
}

function cutsceneInput(k) {
  if (k === "enter" || k === " " || k === "e") {
    cutscene.i++;
    sfx("confirm");
    if (cutscene.i >= cutscene.pages.length) {
      const cb = cutscene.onDone;
      cutscene = null;
      cb?.();
    }
  }
}

function dialogueInput(k) {
  if (k === "escape") {
    dialogue = null;
    mode = "world";
    sfx("cancel");
    return;
  }
  if (k === "enter" || k === " " || k === "e") {
    dialogue.i++;
    sfx("confirm");
    if (dialogue.i >= dialogue.lines.length) {
      const cb = dialogue.onDone;
      dialogue = null;
      mode = "world";
      cb?.();
    }
  }
}

function shopInput(k) {
  const list = Object.keys(ITEMS);
  if (k === "escape") {
    shop = null;
    mode = "world";
    sfx("cancel");
    return;
  }
  if (k === "arrowup" || k === "w") {
    shop.selected = (shop.selected + list.length - 1) % list.length;
    sfx("move");
  } else if (k === "arrowdown" || k === "s") {
    shop.selected = (shop.selected + 1) % list.length;
    sfx("move");
  } else if (k === "enter" || k === " ") {
    const key = list[shop.selected],
      it = ITEMS[key];
    if (state.cash < it.price) {
      notify("NOT ENOUGH CASH");
      sfx("error");
      return;
    }
    state.cash -= it.price;
    state.inventory[key] = (state.inventory[key] || 0) + 1;
    notify(`BOUGHT ${it.name.toUpperCase()}`);
    sfx("confirm");
  }
}

function pauseInput(k) {
  const opts = pauseOptions();
  if (k === "escape") {
    mode = "world";
    sfx("cancel");
    return;
  }
  if (k === "arrowup" || k === "w") {
    pauseSelection = (pauseSelection + opts.length - 1) % opts.length;
    sfx("move");
  } else if (k === "arrowdown" || k === "s") {
    pauseSelection = (pauseSelection + 1) % opts.length;
    sfx("move");
  } else if (k === "enter" || k === " ") {
    opts[pauseSelection].run();
    sfx("confirm");
  }
}

function endingInput(k) {
  if (ending.step === "choice") {
    if (k === "arrowleft" || k === "a" || k === "arrowup" || k === "w") {
      ending.choice = 0;
      sfx("move");
    }
    if (k === "arrowright" || k === "d" || k === "arrowdown" || k === "s") {
      ending.choice = 1;
      sfx("move");
    }
    if (k === "1") ending.choice = 0;
    if (k === "2") ending.choice = 1;
    if (k === "enter" || k === " ") {
      state.endingChoice = ending.choice;
      ending.step = "epilogue";
      ending.page = 0;
      state.flags.ending = true;
      setStage(9);
      saveGame(false);
      sfx("victory");
    }
  } else if (k === "enter" || k === " " || k === "e") {
    ending.page++;
    if (ending.page >= endingPages().length) {
      mode = "world";
      ending = null;
      notify("POSTGAME UNLOCKED");
      saveGame(false);
    }
    sfx("confirm");
  }
}

function handlePuzzleInput(k) {
  if (k === "escape") {
    modal = null;
    return;
  }
  const a = adv();
  if (modal.type === "upgrade") {
    if (["arrowup", "w"].includes(k))
      modal.selection = (modal.selection + 3) % 4;
    if (["arrowdown", "s"].includes(k))
      modal.selection = (modal.selection + 1) % 4;
    if (["enter", "e", " "].includes(k)) buyUpgrade(modal.selection);
    return;
  }
  if (modal.type === "archive") {
    if (["arrowleft", "a", "arrowup", "w"].includes(k))
      modal.selection = (modal.selection + 2) % 3;
    if (["arrowright", "d", "arrowdown", "s"].includes(k))
      modal.selection = (modal.selection + 1) % 3;
    if (["1", "2", "3"].includes(k)) {
      modal.selection = +k - 1;
      k = "enter";
    }
    if (["enter", "e", " "].includes(k)) {
      if (a.catalog.length < 3) {
        notify("FIND ALL THREE CATALOG CARDS FIRST");
        return;
      }
      a.archiveCode.push(modal.selection);
      if (a.archiveCode.length === 3) {
        if (a.archiveCode.join() === "0,1,2") {
          a.archiveOpen = true;
          modal = null;
          notify("VAULT UNLOCKED · RECOVER THE RED LEDGER");
          saveGame(false);
        } else {
          a.archiveCode = [];
          notify("WRONG ORDER · INTAKE → TRANSFER → RELEASE");
          sfx("error");
        }
      }
    }
    return;
  }
  if (modal.type === "channel") {
    if (["arrowleft", "a"].includes(k))
      modal.selection = (modal.selection + 2) % 3;
    if (["arrowright", "d"].includes(k))
      modal.selection = (modal.selection + 1) % 3;
    if (["arrowup", "w"].includes(k))
      a.channel[modal.selection] = (a.channel[modal.selection] + 1) % 5;
    if (["arrowdown", "s"].includes(k))
      a.channel[modal.selection] = (a.channel[modal.selection] + 4) % 5;
    if (["enter", "e", " "].includes(k)) {
      if (a.channel.join() === "2,4,1") {
        a.channelOpen = true;
        modal = null;
        notify("RELAY RESTORED · CONTROL ROOM ACCESS OPEN");
        saveGame(false);
      } else {
        notify("SIGNAL MISMATCH · MATCH 2 / 4 / 1");
        sfx("error");
      }
    }
  }
}

function handleConfirmationInput(k) {
  if (modal?.type === "newgame") {
    if (k === "escape") {
      modal = null;
      return;
    }
    if (["arrowleft", "arrowright", "a", "d"].includes(k))
      modal.selection = 1 - modal.selection;
    if (k === "enter" || k === " ") {
      if (modal.selection === 1) {
        modal = null;
        startNewGame();
      } else modal = null;
    }
    return;
  }
  handlePuzzleInput(k);
}

function modalInput(k) {
  if (["talents", "automation", "trials", "mission"].includes(modal.type)) {
    if (
      k === "escape" ||
      (k === "p" && modal.type === "talents") ||
      (k === "b" && modal.type === "automation")
    ) {
      modal = null;
      saveGame(false);
      return;
    }
    if (modal.type === "talents") {
      if (["arrowleft", "a"].includes(k))
        modal.selection = (modal.selection + 3) % 4;
      if (["arrowright", "d"].includes(k))
        modal.selection = (modal.selection + 1) % 4;
      if (["1", "2", "3"].includes(k))
        buyTalent(state.party[modal.selection], TALENTS[+k - 1]);
    }
    if (modal.type === "automation") {
      if (["1", "2", "3", "4"].includes(k)) setAutoMode(+k - 1);
      if (k === "v")
        state.settings.battleSpeed = (state.settings.battleSpeed % 3) + 1;
    }
    if (modal.type === "trials") {
      if (["arrowup", "w", "arrowleft", "a"].includes(k))
        modal.selection = (modal.selection + 5) % 6;
      if (["arrowdown", "s", "arrowright", "d"].includes(k))
        modal.selection = (modal.selection + 1) % 6;
      if (["enter", "e", " "].includes(k)) beginTrial(modal.selection);
    }
    return;
  }
  handleConfirmationInput(k);
}
