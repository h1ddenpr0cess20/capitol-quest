// All data, state and render components exist before events or the loop start.
recoverPlayerPosition();
resetTrail();
bindInputEvents();
bindShellControls();
installDebugTools();
requestAnimationFrame(loop);
setInterval(() => {
  if (state.started && mode === "world") saveGame(false);
}, 45000);
