function updateCamera() {
  const m = currentMap();
  camera.x = clamp(state.player.x - W / 2, 0, Math.max(0, m.w - W));
  camera.y = clamp(
    state.player.y - WORLD_VIEW_H * 0.55,
    0,
    Math.max(0, m.h - WORLD_VIEW_H),
  );
}

function adv() {
  return state.adventure;
}

function updateMobs(dt) {
  for (const mob of WORLD_ENCOUNTERS[state.zone] || []) {
    const key = mobKey(state.zone, mob.id);
    if (state.defeated[key]) continue;
    const mm =
      worldMobMotion[key] ||
      (worldMobMotion[key] = {
        x: mob.x,
        y: mob.y,
        t: 0,
        dir: "left",
      });
    mm.t += dt;
    const dx = state.player.x - mm.x,
      dy = state.player.y - mm.y,
      d = Math.hypot(dx, dy);
    let vx = Math.sin(mm.t * 0.65) * 10,
      vy = Math.cos(mm.t * 0.55) * 7;
    if (d < 155 && d > 45 && encounterGrace <= 0) {
      vx = (dx / d) * 46;
      vy = (dy / d) * 46;
    }
    const nx = clamp(mm.x + vx * dt, mob.x - 70, mob.x + 70),
      ny = clamp(mm.y + vy * dt, mob.y - 70, mob.y + 70);
    if (!collides(nx, mm.y)) mm.x = nx;
    if (!collides(mm.x, ny)) mm.y = ny;
    mm.dir = dx < 0 ? "left" : "right";
    if (encounterGrace <= 0 && d < 44) {
      walkPath = [];
      startBattle(
        [
          {
            type: mob.type,
            level: mob.level,
          },
          {
            type: mob.partner,
            level: mob.level,
          },
        ],
        {
          gold: 35 + mob.level * 12,
          label: MAPS[state.zone].name,
          worldMob: key,
        },
      );
      return;
    }
  }
}

function npcList() {
  return NPCS[state.zone] || [];
}

function currentMap() {
  return MAPS[state.zone];
}

function collides(x, y) {
  const r = 18;
  return worldSolids(state.zone).some((s) => rectContains(s, x, y, r));
}

function updateWorldMovement(dt) {
  state.playTime += dt;
  encounterGrace = Math.max(0, encounterGrace - dt);
  const p = state.player;
  let dx = 0,
    dy = 0;
  if (keys.has("arrowup") || keys.has("w")) dy--;
  if (keys.has("arrowdown") || keys.has("s")) dy++;
  if (keys.has("arrowleft") || keys.has("a")) dx--;
  if (keys.has("arrowright") || keys.has("d")) dx++;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    const ox = p.x,
      oy = p.y;
    const nx = p.x + dx * p.speed * dt;
    if (!collides(nx, p.y)) p.x = nx;
    const ny = p.y + dy * p.speed * dt;
    if (!collides(p.x, ny)) p.y = ny;
    p.dir =
      Math.abs(dx) > Math.abs(dy)
        ? dx < 0
          ? "left"
          : "right"
        : dy < 0
          ? "up"
          : "down";
    const moved = Math.hypot(p.x - ox, p.y - oy);
    p.step += moved / 19;
    p.frame = Math.floor(p.step) % 4;
    if (moved > 0) recordTrail();
  } else p.frame = 0;
  const m = currentMap();
  p.x = clamp(p.x, 45, m.w - 45);
  p.y = clamp(p.y, 95, m.h - 45);
  updateMobs(dt);
  updateCamera();
}

function mobKey(z, id) {
  return `${z}:${id}`;
}

function recordTrail() {
  const p = state.player;
  trail.unshift({
    x: p.x,
    y: p.y,
    dir: p.dir,
    frame: p.frame,
  });
  let d = 0,
    end = trail.length;
  for (let i = 1; i < trail.length; i++) {
    d += dist(trail[i - 1], trail[i]);
    if (d > 240) {
      end = i + 1;
      break;
    }
  }
  trail.length = end;
  lastTrailPoint = {
    ...trail[0],
  };
}

function followerAt(distance) {
  let pts = [
      {
        ...state.player,
      },
      ...trail,
    ],
    remaining = distance;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i]);
    if (d >= remaining && d > 0) {
      const t = remaining / d;
      return {
        x: lerp(pts[i - 1].x, pts[i].x, t),
        y: lerp(pts[i - 1].y, pts[i].y, t),
        dir: pts[i - 1].dir,
        frame: state.player.frame,
      };
    }
    remaining -= d;
  }
  return {
    ...pts[pts.length - 1],
    frame: 0,
  };
}

function recoverPlayerPosition() {
  const p = state.player,
    m = currentMap();
  p.x = clamp(Number(p.x) || m.spawn.x, 110, m.w - 110);
  p.y = clamp(Number(p.y) || m.spawn.y, 120, m.h - 120);
  if (!collides(p.x, p.y)) return;
  for (let r = 24; r < Math.max(m.w, m.h); r += 24)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
      const x = p.x + Math.cos(a) * r,
        y = p.y + Math.sin(a) * r;
      if (
        x > 110 &&
        y > 120 &&
        x < m.w - 110 &&
        y < m.h - 100 &&
        !collides(x, y)
      ) {
        p.x = x;
        p.y = y;
        return;
      }
    }
}

function updateKeyboardMovement(dt) {
  state.player.speed = keys.has("shift") ? 310 : 205;
  updateWorldMovement(dt);
}

function findPath(from, to, zone = state.zone) {
  const size = 32,
    cols = 60,
    rows = 40,
    solids = worldSolids(zone),
    open = (x, y) =>
      x >= 0 &&
      y >= 0 &&
      x < cols &&
      y < rows &&
      !solids.some((s) => rectContains(s, x * size + 16, y * size + 16, 20));
  const sx = Math.floor(from.x / size),
    sy = Math.floor(from.y / size),
    tx = Math.floor(to.x / size),
    ty = Math.floor(to.y / size);
  const queue = [[sx, sy]],
    came = new Map([[sy * cols + sx, null]]);
  let end = null;
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (Math.hypot(x - tx, y - ty) <= 1 && open(x, y)) {
      end = y * cols + x;
      break;
    }
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const xx = x + dx,
        yy = y + dy,
        k = yy * cols + xx;
      if (open(xx, yy) && !came.has(k)) {
        came.set(k, y * cols + x);
        queue.push([xx, yy]);
      }
    }
  }
  if (end === null) return [];
  const path = [];
  while (came.get(end) !== null) {
    path.unshift({
      x: (end % cols) * size + 16,
      y: Math.floor(end / cols) * size + 16,
    });
    end = came.get(end);
  }
  return path;
}

function worldSolids(zone) {
  const m = MAPS[zone];
  return [
    {
      x: 0,
      y: 0,
      w: m.w,
      h: 100,
    },
    {
      x: 0,
      y: m.h - 60,
      w: m.w,
      h: 60,
    },
    {
      x: 0,
      y: 0,
      w: 70,
      h: m.h,
    },
    {
      x: m.w - 70,
      y: 0,
      w: 70,
      h: m.h,
    },
    ...DISTRICTS[zone].objects
      .filter((o) => !["seal"].includes(o[0]))
      .map((o) => ({
        x: o[1],
        y: o[2],
        w: o[3],
        h: o[4],
      })),
  ];
}

function updateWorld(dt) {
  const manual = [
    "w",
    "a",
    "s",
    "d",
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
  ].some((k) => keys.has(k));
  if (manual) walkPath = [];
  if (walkPath.length && !manual) {
    const p = state.player,
      t = walkPath[0],
      dx = t.x - p.x,
      dy = t.y - p.y,
      d = Math.hypot(dx, dy),
      v = 275 * dt;
    if (d < v + 1) {
      p.x = t.x;
      p.y = t.y;
      walkPath.shift();
    } else {
      const nx = p.x + (dx / d) * v,
        ny = p.y + (dy / d) * v;
      if (!collides(nx, ny)) {
        p.x = nx;
        p.y = ny;
        p.dir =
          Math.abs(dx) > Math.abs(dy)
            ? dx < 0
              ? "left"
              : "right"
            : dy < 0
              ? "up"
              : "down";
        p.step += v / 19;
        p.frame = Math.floor(p.step) % 4;
        recordTrail();
      } else walkPath = [];
    }
    state.playTime += dt;
    encounterGrace = Math.max(0, encounterGrace - dt);
    updateMobs(dt);
    updateCamera();
    if (!walkPath.length && walkTarget && dist(p, walkTarget) < 90) {
      const t = walkTarget;
      walkTarget = null;
      if (t.kind === "npc") startDialogue(t);
      else t.run?.();
    }
    return;
  }
  updateKeyboardMovement(dt);
}

function resetTrail() {
  const p = state.player;
  trail = [
    {
      x: p.x,
      y: p.y,
      dir: p.dir,
      frame: 0,
    },
  ];
  let v =
    p.dir === "up"
      ? {
          x: 0,
          y: 1,
        }
      : p.dir === "down"
        ? {
            x: 0,
            y: -1,
          }
        : p.dir === "left"
          ? {
              x: 1,
              y: 0,
            }
          : {
              x: -1,
              y: 0,
            };
  for (let i = 1; i <= 45; i++) {
    const last = trail.at(-1),
      candidates = [
        v,
        {
          x: -v.y,
          y: v.x,
        },
        {
          x: v.y,
          y: -v.x,
        },
      ],
      next = candidates
        .map((d) => ({
          x: last.x + d.x * 4,
          y: last.y + d.y * 4,
          v: d,
        }))
        .find(
          (n) =>
            !collides(n.x, n.y) &&
            !trail.slice(0, -1).some((t) => dist(t, n) < 3),
        );
    if (!next) break;
    v = next.v;
    const dir =
      Math.abs(v.x) > Math.abs(v.y)
        ? v.x > 0
          ? "left"
          : "right"
        : v.y > 0
          ? "up"
          : "down";
    trail.push({
      x: next.x,
      y: next.y,
      dir,
      frame: 0,
    });
  }
  lastTrailPoint = {
    ...trail[0],
  };
  trailDistance = 0;
}
