function initAudio() {
  if (audioCtx || !state.settings.sound) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {}
}

function sfx(type) {
  if (!state.settings.sound) return;
  initAudio();
  if (!audioCtx) return;
  const map = {
    move: [180, 0.025],
    confirm: [420, 0.055],
    cancel: [240, 0.05],
    hit: [110, 0.07],
    magic: [620, 0.1],
    heal: [760, 0.12],
    victory: [880, 0.14],
    save: [520, 0.08],
    error: [140, 0.09],
  };
  const [freq, dur] = map[type] || map.confirm;
  const o = audioCtx.createOscillator(),
    g = audioCtx.createGain();
  o.type = type === "hit" ? "square" : "triangle";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.045, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

function musicNote(midi, duration, gain = 0.012, type = "triangle") {
  if (!audioCtx || audioCtx.state !== "running") return;
  const o = audioCtx.createOscillator(),
    g = audioCtx.createGain(),
    t = audioCtx.currentTime;
  o.type = type;
  o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + duration + 0.02);
}

function updateMusic(dt) {
  if (!state.settings.sound || !audioCtx || mode === "pause") return;
  const scene = mode === "battle" ? "battle" : "world";
  if (scene !== musicScene) {
    musicScene = scene;
    musicBeat = 0;
    musicClock = 0;
  }
  musicClock -= dt;
  if (musicClock > 0) return;
  const tempo = scene === "battle" ? 0.19 : 0.34;
  musicClock = tempo;
  const roots = scene === "battle" ? [45, 45, 41, 43] : [48, 43, 45, 41],
    root = roots[Math.floor(musicBeat / 16) % 4],
    melody =
      scene === "battle"
        ? [0, 7, 12, 10, 7, 3, 7, 12]
        : [0, 7, 12, 7, 3, 10, 7, 3];
  musicNote(
    root + 12 + melody[musicBeat % 8],
    tempo * 0.85,
    scene === "battle" ? 0.011 : 0.008,
    "triangle",
  );
  if (musicBeat % 4 === 0) musicNote(root, tempo * 3.8, 0.014, "triangle");
  if (scene === "battle" && musicBeat % 2 === 0)
    musicNote(30, tempo * 0.23, 0.008, "square");
  musicBeat++;
}
