function bindShellControls() {
  bindTouch("btnMap", "m");
  bindTouch("btnBag", "i");
  document.getElementById("fullscreen").onclick = () => {
    const shell = document.getElementById("wrap");
    if (document.fullscreenElement) document.exitFullscreen();
    else shell.requestFullscreen?.();
  };
  document.getElementById("exportSave").onclick = () => {
    if (state.started) exportSave();
    else notify("START OR LOAD A GAME FIRST");
  };
  document.getElementById("importSave").onclick = () =>
    document.getElementById("saveFile").click();
  document.getElementById("saveFile").onchange = (e) => {
    importSaveFile(e.target.files[0]);
    e.target.value = "";
  };
  document.getElementById("helpButton").onclick = () => {
    if (mode === "title" || mode === "world") overlay = "controls";
    else notify("RETURN TO THE WORLD OR TITLE TO OPEN HELP");
  };
}
