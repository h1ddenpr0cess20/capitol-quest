function bindTouch(id, key, hold = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    initAudio();
    if (hold) keys.add(key);
    handleInput(key);
    el.setPointerCapture?.(e.pointerId);
  });
  const up = (e) => {
    e.preventDefault();
    if (hold) keys.delete(key);
  };
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("pointerleave", up);
}

function handleGameplayInput(k) {
  initAudio();
  if (mode === "title") return titleInput(k);
  if (mode === "cutscene") return cutsceneInput(k);
  if (mode === "ending") return endingInput(k);
  if (mode === "battle") return battleInput(k);
  if (mode === "dialogue") return dialogueInput(k);
  if (mode === "shop") return shopInput(k);
  if (mode !== "world") return;
  if (transition.dir) return;
  if (overlay) {
    if (
      k === "escape" ||
      (overlay === "map" && k === "m") ||
      (overlay === "quests" && k === "q") ||
      (overlay === "status" && k === "i")
    ) {
      overlay = null;
      sfx("cancel");
    }
    return;
  }
  if (k === "escape") {
    pauseSelection = 0;
    mode = "pause";
    sfx("confirm");
    return;
  }
  if (k === "m") {
    overlay = "map";
    sfx("confirm");
    return;
  }
  if (k === "q") {
    overlay = "quests";
    sfx("confirm");
    return;
  }
  if (k === "i") {
    overlay = "status";
    sfx("confirm");
    return;
  }
  if (k === "f5") {
    saveGame();
    return;
  }
  if (k === "e" || k === "enter" || k === " ") {
    interact();
    return;
  }
}

function handleSceneInput(k) {
  if (mode === "pause") return pauseInput(k);
  handleGameplayInput(k);
}

function syncTouchMenu() {
  const host = document.getElementById("touchMenu");
  if (!host?.replaceChildren) return;
  const signature = buttons.map((b) => b.label + !!b.disabled).join("|");
  if (signature === touchMenuSignature) return;
  touchMenuSignature = signature;
  host.replaceChildren(
    ...buttons.map((b, i) => {
      const el = document.createElement("button");
      el.textContent = b.label;
      el.disabled = !!b.disabled;
      el.onclick = () => {
        initAudio();
        buttons[i]?.fn?.();
      };
      return el;
    }),
  );
}

function handleMenuInput(k) {
  if (modal) return modalInput(k);
  if (overlay === "status") {
    if (["escape", "i"].includes(k)) {
      overlay = null;
      return;
    }
    if (["arrowup", "w"].includes(k)) supplyIndex = (supplyIndex + 5) % 6;
    if (["arrowdown", "s"].includes(k)) supplyIndex = (supplyIndex + 1) % 6;
    if (["arrowleft", "a"].includes(k)) allyIndex = (allyIndex + 3) % 4;
    if (["arrowright", "d"].includes(k)) allyIndex = (allyIndex + 1) % 4;
    if (["enter", "e", " "].includes(k))
      useFieldItem(Object.keys(ITEMS)[supplyIndex], state.party[allyIndex]);
    return;
  }
  handleSceneInput(k);
}

function handleProgressionInput(k) {
  if (modal || overlay) {
    handleMenuInput(k);
    return;
  }
  if (mode === "world" && k === "p") {
    modal = {
      type: "talents",
      selection: 0,
    };
    return;
  }
  if (mode === "world" && k === "b") {
    modal = {
      type: "automation",
      selection: 0,
    };
    return;
  }
  if (mode === "world" && k === "escape") walkPath = [];
  handleMenuInput(k);
}

function handleInput(k) {
  if (!modal && overlay === "map") {
    if (["m", "escape"].includes(k)) {
      overlay = null;
      return;
    }
    if (k === "tab") {
      atlasTab = atlasTab === "local" ? "districts" : "local";
      return;
    }
    if (atlasTab === "districts") {
      const list = Object.keys(DISTRICTS),
        i = list.indexOf(atlasSelection);
      if (["arrowleft", "a", "arrowup", "w"].includes(k))
        atlasSelection = list[(i + 11) % 12];
      if (["arrowright", "d", "arrowdown", "s"].includes(k))
        atlasSelection = list[(i + 1) % 12];
      if (["enter", "e", " "].includes(k)) travelSelected();
    }
    return;
  }
  handleProgressionInput(k);
}
