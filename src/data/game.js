const WORLD_VIEW_H = 548;

const BATTLE_VIEW_H = 470;

const VERSION = "WIP";

const SAVE_KEY = "capitol_quest_v6";

const PREVIOUS_SAVE_KEY = "capitol_quest_v5";

const LEGACY_KEY = "capitol_quest_rebuilt_v2";

const BOSS_SCENES = {
  SENTINEL: [
    {
      speaker: "NARRATOR",
      text: "The relay key clears the checkpoint. The Sentinel log shows the same hand-off code repeated beside an archive transfer: RED-17.",
    },
    {
      speaker: "HEGSETH",
      portrait: "HEGSETH",
      text: "That gives us a route, not a conclusion. We follow RED-17 to the original ledger and compare every hand-off.",
    },
    {
      speaker: "NARRATOR",
      text: "The east passage opens. The Public Archive is now reachable.",
    },
  ],
  FIXER: [
    {
      speaker: "NARRATOR",
      text: "The control room comes back online. Its queue contains a clipped broadcast copy, but the source locker still holds the untouched transcript.",
    },
    {
      speaker: "LUTNICK",
      portrait: "LUTNICK",
      text: "The ledger tells us who handled the record. The transcript tells us what changed. We need both verified before the hearing.",
    },
    {
      speaker: "NARRATOR",
      text: "Recover the source transcript, then take both originals to the Fact Checker.",
    },
  ],
  CHAIR: [
    {
      speaker: "NARRATOR",
      text: "The gavel falls. The verified chain of custody is entered into the hearing record without breaking the source trail.",
    },
    {
      speaker: "TRUMP",
      portrait: "TRUMP",
      text: "We have the complete record. Now the last choice is procedure: publish it immediately, or file it with the hearing first.",
    },
    {
      speaker: "NARRATOR",
      text: "Approach the Public Record at the center aisle to choose the ending.",
    },
  ],
};

const MAIN_STAGES = [
  {
    title: "A Missing Voice",
    desc: "Speak with the Protester at the Mall rally.",
  },
  {
    title: "The Service Route",
    desc: "Interview the Veteran and Teacher about the missing megaphone.",
  },
  {
    title: "Recover the Megaphone",
    desc: "Search the service yard on the Capitol Grounds.",
  },
  {
    title: "The Locked Rotunda",
    desc: "Enter the Capitol and defeat the Sentinel.",
  },
  {
    title: "The Red Ledger",
    desc: "Reach the Public Archive and secure the original ledger.",
  },
  {
    title: "The Missing Transcript",
    desc: "Reach the Broadcast Center, defeat the Fixer, and open the source locker.",
  },
  {
    title: "Chain of Custody",
    desc: "Bring the ledger and transcript to the Fact Checker.",
  },
  {
    title: "The Final Hearing",
    desc: "Enter the hearing chamber and defeat the Committee Chair.",
  },
  {
    title: "The Public Record",
    desc: "Choose what happens to the complete source record.",
  },
  {
    title: "After the Broadcast",
    desc: "The case is closed. Explore, finish side objectives, or start again.",
  },
];
