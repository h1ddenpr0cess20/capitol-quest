function updateTransition(dt) {
  if (!transition.dir) return;
  transition.alpha += transition.dir * dt * 3;
  if (transition.dir > 0 && transition.alpha >= 1) {
    transition.alpha = 1;
    transition.callback?.();
    transition.callback = null;
    transition.dir = -1;
  } else if (transition.dir < 0 && transition.alpha <= 0) {
    transition.alpha = 0;
    transition.dir = 0;
  }
}

function updateSimulation(dt) {
  totalTime += dt;
  if (toast.time > 0) toast.time -= dt;
  updateTransition(dt);
  if (mode === "pause") {
  } else if (mode === "world" && !overlay && !transition.dir) updateWorld(dt);
  else if (mode === "battle") updateBattle(dt);
  updateEffects(dt);
}

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000 || 0);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function updateWithMenus(dt) {
  if (modal) {
    totalTime += dt;
    if (toast.time > 0) toast.time -= dt;
    return;
  }
  updateSimulation(dt);
}

function update(dt) {
  updateWithMenus(dt);
  if (!modal && !overlay) updateMusic(dt);
}
