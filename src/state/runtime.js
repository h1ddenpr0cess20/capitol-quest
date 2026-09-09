const state = freshState();

let mode = "title";

let titleSelection = 0;

let pauseSelection = 0;

let overlay = null;

let dialogue = null;

let shop = null;

let cutscene = null;

let battle = null;

let ending = null;

let toast = {
  text: "",
  time: 0,
};

let camera = {
  x: 0,
  y: 0,
};

let particles = [];

let spriteFx = [];

let floaters = [];

let screenShake = 0;

let transition = {
  alpha: 0,
  dir: 0,
  callback: null,
};

let last = performance.now();

let totalTime = 0;

let trail = [];

let trailDistance = 0;

let lastTrailPoint = {
  x: state.player.x,
  y: state.player.y,
  dir: "down",
};

let worldMobMotion = {};

let encounterGrace = 0;

let audioCtx = null;

const keys = new Set();

let buttons = [];

let pointer = {
  x: -1,
  y: -1,
};

let modal = null;

let supplyIndex = 0;

let allyIndex = 0;

let musicBeat = 0;

let musicClock = 0;

let musicScene = "";

const tilePatterns = new Map();

let touchMenuSignature = "";

let walkPath = [];

let walkTarget = null;

const districtCanvases = new Map();

let atlasTab = "districts";

let atlasSelection = "MALL";
