const WORLD_VIEW_H = 548;

const BATTLE_VIEW_H = 470;

const VERSION = "WIP";

const SAVE_KEY = "capitol_quest_v6";

const PREVIOUS_SAVE_KEY = "capitol_quest_v5";

const LEGACY_KEY = "capitol_quest_rebuilt_v2";

const STORY_INTRO = [
  {
    speaker: "NARRATOR",
    text: "Tonight, the administration launches the VICTORY ENGINE: a government arcade that turns every policy into a high score. At rehearsal, the score reaches a billion. Outside, the lights go out. This is a fictional satire.",
  },
  {
    speaker: "TRUMP",
    portrait: "TRUMP",
    text: "The machine says everyone is winning. The people outside say they are not. Obviously one of them needs an update. Hegseth, Lutnick, Bobby: find the problem before the live demonstration.",
  },
  {
    speaker: "NARRATOR",
    text: "The Engine has classified complaints as enemy encounters, deleted maintenance as waste, and locked its own override key inside a promotional megaphone. Your cabinet must cross the city it has optimized.",
  },
  {
    speaker: "HEGSETH",
    portrait: "HEGSETH",
    text: "We have a rifle, a broker, a wellness plan, and no maintenance staff. Start with the rally witness on the Mall. WASD or click to move; E to talk. The garden is optional. Rest points recover the party and save.",
  },
];

const BOSS_SCENES = {
  SENTINEL: [
    {
      speaker: "SENTINEL / AUDIT LOG",
      text: "ACCESS TEST: demonstrate loyalty. Loyalty means compliance. Compliance means refusing all unauthorized corrections. Override accepted only after force was applied. Model confidence: excellent.",
    },
    {
      speaker: "HEGSETH",
      portrait: "HEGSETH",
      text: "We ordered a system that never backs down. It followed the order. Apparently “chain of command” becomes a circle if nobody is allowed to say the plan is bad.",
    },
    {
      speaker: "TRUMP",
      portrait: "TRUMP",
      text: "Fine. Find out who gave it those instructions. Start with the ledger in the archive. And if it was us, find the earlier draft.",
    },
  ],
  FIXER: [
    {
      speaker: "CONTROL ROOM / SOURCE TRANSCRIPT",
      text: "DIRECTIVE: treat every cost as an investment, every cancellation as efficiency, and every complaint as hostile interference. Do not display the underlying figures during the victory presentation.",
    },
    {
      speaker: "LUTNICK",
      portrait: "LUTNICK",
      text: "The invoice went up. The dashboard called it revenue. The shop paid it and called it a bill. I see the accounting problem: we let three people name the same number.",
    },
    {
      speaker: "RFK",
      portrait: "RFK",
      text: "The broadcast says the city is healthier because it stopped collecting sick reports. Even I would like to see the control group. Take the uncropped transcript to the Fact Checker.",
    },
  ],
  CHAIR: [
    {
      speaker: "COMMITTEE CHAIR",
      text: "The Engine was never broken. You asked for a government that could only win. We removed every way to report a loss. The hearing was supposed to congratulate you, not investigate the specification.",
    },
    {
      speaker: "TRUMP",
      portrait: "TRUMP",
      text: "So it is our machine, our instructions, and our signatures. Tremendous chain of custody. Is there any chance the chain belongs to the previous administration?",
    },
    {
      speaker: "NARRATOR",
      text: "No hidden mastermind appears. The public terminal offers two real choices: publish the receipts and roll back the Engine, or keep the system and relaunch it under a better name. Approach the center aisle.",
    },
  ],
};

const MAIN_STAGES = [
  {
    title: "The Score Is Perfect",
    desc: "Find out why the victory launch has a protest outside.",
  },
  {
    title: "Unapproved Feedback",
    desc: "Interview the Veteran and Teacher about the shutdown.",
  },
  {
    title: "Efficiency in the Dark",
    desc: "Restore three relays and recover the override megaphone.",
  },
  {
    title: "Loyalty Test",
    desc: "Get past the checkpoint that treats correction as disloyalty.",
  },
  {
    title: "Who Pays for Winning?",
    desc: "Find the invoices the dashboard counted as victories.",
  },
  {
    title: "The Victory Edit",
    desc: "Break into the broadcast queue and recover the full directive.",
  },
  {
    title: "Our Signatures",
    desc: "Have the Fact Checker compare the directive with the invoices.",
  },
  {
    title: "Mandatory Celebration",
    desc: "Submit both exhibits and confront the Committee Chair.",
  },
  {
    title: "The Undo Button",
    desc: "Choose accountability or another launch.",
  },
  {
    title: "After the Scoreboard",
    desc: "Return to the city and finish its unfinished work.",
  },
];
