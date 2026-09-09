function bindInputEvents() {
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        " ",
        "f5",
        "tab",
      ].includes(k)
    )
      e.preventDefault();
    if (!keys.has(k)) handleInput(k);
    keys.add(k);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
  bindTouch("up", "w", true);
  bindTouch("down", "s", true);
  bindTouch("left", "a", true);
  bindTouch("right", "d", true);
  bindTouch("btnA", "enter");
  bindTouch("btnB", "escape");
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) * W) / r.width;
    pointer.y = ((e.clientY - r.top) * H) / r.height;
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.x = -1;
    pointer.y = -1;
  });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.focus();
    const r = canvas.getBoundingClientRect(),
      x = ((e.clientX - r.left) * W) / r.width,
      y = ((e.clientY - r.top) * H) / r.height;
    const b = [...buttons]
      .reverse()
      .find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    if (b && !b.disabled) {
      initAudio();
      b.fn();
      sfx("confirm");
    }
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Shift") e.preventDefault();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      keys.clear();
      if (mode === "world" && !overlay && !modal) {
        pauseSelection = 0;
        mode = "pause";
      }
    }
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (mode !== "world" || overlay || modal || transition.dir) return;
    const r = canvas.getBoundingClientRect(),
      sx = ((e.clientX - r.left) * W) / r.width,
      sy = ((e.clientY - r.top) * H) / r.height;
    if (
      sy > WORLD_VIEW_H ||
      buttons.some(
        (b) => sx >= b.x && sx < b.x + b.w && sy >= b.y && sy < b.y + b.h,
      )
    )
      return;
    const to = {
      x: sx + camera.x,
      y: sy + camera.y,
    };
    walkTarget =
      [
        ...npcList().map((n) => ({
          ...n,
          kind: "npc",
        })),
        ...interactables().filter((i) => !i.hidden?.()),
      ]
        .sort((a, b) => dist(a, to) - dist(b, to))
        .find((t) => dist(t, to) < 60) || null;
    walkPath = findPath(state.player, walkTarget || to);
    if (!walkPath.length && walkTarget && dist(state.player, walkTarget) < 90) {
      if (walkTarget.kind === "npc") startDialogue(walkTarget);
      else walkTarget.run?.();
      walkTarget = null;
    }
  });
}
