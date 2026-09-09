function setStage(n, silent = false) {
  if (n <= state.mainStage && !silent) return;
  state.mainStage = clamp(n, 0, 9);
  state.chapter = Math.min(6, Math.floor(state.mainStage / 2) + 1);
  log(`Main quest: ${MAIN_STAGES[state.mainStage].title}`);
  if (!silent) {
    notify(
      `QUEST UPDATED — ${MAIN_STAGES[state.mainStage].title.toUpperCase()}`,
    );
    saveGame(false);
  }
}

function log(text) {
  state.log.unshift({
    t: Math.floor(state.playTime),
    text,
  });
  state.log = state.log.slice(0, 30);
}

function notify(text, time = 2.5) {
  toast.text = text;
  toast.time = time;
}
