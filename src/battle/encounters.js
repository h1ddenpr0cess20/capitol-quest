function refreshIntents() {
  battle.enemies.forEach((e) => {
    e.intent = planIntent(e);
  });
}

function beginTrial(i) {
  const t = TRIALS[i];
  modal = null;
  startBattle(
    t.types.map((type) => ({
      type,
      level: t.level,
    })),
    {
      trial: i,
      xp: t.xp,
      gold: t.gold,
      label: "TRIAL · " + t.name,
    },
  );
}

function makeEnemy(spec) {
  const d = ENEMY_DEFS[spec.type],
    level = clamp(
      Math.max(
        spec.level || 1,
        d.boss
          ? Math.round(
              state.party.reduce((n, p) => n + p.lvl, 0) / state.party.length,
            ) - 1
          : 1,
      ),
      1,
      25,
    ),
    scale = 0.82 + (level - 1) * 0.095,
    difficulty =
      state.settings.difficulty === "Story"
        ? 0.76
        : state.settings.difficulty === "Tactical"
          ? 1.18
          : 1;
  return {
    type: spec.type,
    name: d.label,
    sprite: d.sprite,
    level,
    maxHp: Math.round(d.hp * scale * difficulty * (d.boss ? 2.1 : 1)),
    hp: Math.round(d.hp * scale * difficulty * (d.boss ? 2.1 : 1)),
    atk: Math.round(d.atk * (0.85 + (level - 1) * 0.09) * difficulty),
    def: Math.round(d.def * (0.9 + (level - 1) * 0.06)),
    mag: Math.round(d.mag * (0.85 + (level - 1) * 0.09) * difficulty),
    ai: d.ai,
    trait: d.trait,
    quote: d.quote || "Keep the record intact.",
    boss: !!d.boss,
    status: {},
    guard: false,
    analyzed: false,
  };
}

function planIntent(e) {
  if (e.broken)
    return {
      kind: "broken",
      label: "BROKEN · skips turn",
      power: 0,
    };
  const round = battle.round;
  const caster = [
    "teacher",
    "journalist",
    "scientist",
    "fixer",
    "chair",
    "activist",
    "engineer",
    "director",
    "auditor",
  ].includes(e.ai);
  if (e.boss && round % 3 === 0)
    return {
      kind: "sweep",
      label: "CHARGE · all heroes",
      power: e.ai === "custodian" ? 1.35 : 1.05,
    };
  if (e.ai === "curator" && round % 3 === 2)
    return {
      kind: "drain",
      label: "Roots · drain HP",
      power: 1.1,
    };
  if (e.ai === "engineer" && round % 3 === 2)
    return {
      kind: "disrupt",
      label: "EMP · lower MAG",
      power: 1.1,
    };
  if (e.ai === "auditor" && round % 3 === 2)
    return {
      kind: "guard",
      label: "Audit · raise armor",
      power: 1,
    };
  if (e.hp / e.maxHp < 0.45 && ["nurse", "senior"].includes(e.ai))
    return {
      kind: "heal",
      label: "Recover ally HP",
      power: 1,
    };
  if (
    round % 3 === 2 &&
    ["veteran", "union", "sentinel", "conductor"].includes(e.ai)
  )
    return {
      kind: "guard",
      label: "Brace · armor up",
      power: 1,
    };
  return {
    kind: caster ? "magic" : "physical",
    label: e.resolveTurns
      ? "RESOLVE · strike"
      : e.boss && e.hp / e.maxHp < 0.4
        ? "FURY · strong strike"
        : caster
          ? "Signal strike"
          : "Physical strike",
    power: e.boss ? (e.hp / e.maxHp < 0.4 ? 1.5 : 1.2) : 1,
  };
}
