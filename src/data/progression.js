const AUTO_MODES = ["Manual", "Balanced", "Aggressive", "Conserve"];

const TALENTS = [
  {
    id: "power",
    name: "Power",
    desc: "+3 ATK / rank",
    max: 7,
  },
  {
    id: "focus",
    name: "Focus",
    desc: "+3 MAG, +4 max MP / rank",
    max: 7,
  },
  {
    id: "vitality",
    name: "Vitality",
    desc: "+16 max HP, +1 DEF / rank",
    max: 7,
  },
];

const RELICS = {
  GARDEN: "Living Remedy",
  TUNNELS: "Copper Circuit",
  RECORDS: "Certified Seal",
  ROOFTOPS: "Clear Frequency",
  STATION: "Transit Badge",
  VAULT: "Complete Record",
};

const SKILL_LEVELS = [1, 2, 4, 7, 11];

const TRIALS = [
  {
    name: "First Principles",
    level: 2,
    types: ["PROTESTER", "STUDENT"],
    desc: "Two opponents. Learn to exploit weaknesses.",
    xp: 130,
    gold: 90,
  },
  {
    name: "Steel & Signal",
    level: 4,
    types: ["VETERAN", "SCIENTIST"],
    desc: "Armored and tech enemies both fear magic.",
    xp: 175,
    gold: 130,
  },
  {
    name: "Press Scramble",
    level: 6,
    types: ["JOURNALIST", "NURSE", "ACTIVIST"],
    desc: "Break the healer before it can recover.",
    xp: 225,
    gold: 175,
  },
  {
    name: "Standing Together",
    level: 8,
    types: ["UNION", "VETERAN", "NURSE"],
    desc: "Three resilient targets. Focus your damage.",
    xp: 280,
    gold: 220,
  },
  {
    name: "Cross Examination",
    level: 10,
    types: ["TEACHER", "SCIENTIST", "SENIOR"],
    desc: "Keep your party healthy under magic pressure.",
    xp: 340,
    gold: 280,
  },
  {
    name: "Night Session",
    level: 12,
    types: ["SENTINEL", "FIXER"],
    desc: "Two bosses at once. Break their charged attacks.",
    xp: 450,
    gold: 360,
  },
];
