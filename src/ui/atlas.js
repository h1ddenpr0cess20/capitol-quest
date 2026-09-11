function miniMap(x, y, w, h, z = state.zone, details = false) {
  const m = MAPS[z],
    sc = Math.min(w / m.w, h / m.h),
    ox = x + (w - m.w * sc) / 2,
    oy = y + (h - m.h * sc) / 2;
  ctx.drawImage(districtScene(z, true), ox, oy, m.w * sc, m.h * sc);
  ctx.fillStyle = "#0a24351f";
  ctx.fillRect(ox, oy, m.w * sc, m.h * sc);
  const dot = (px, py, c, r) => {
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.arc(ox + px * sc, oy + py * sc, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#102832";
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  if (z === state.zone) {
    if (details) {
      npcList().forEach((n) => dot(n.x, n.y, "#8ce3d0", 4));
      WORLD_ENCOUNTERS[z]
        .filter((m) => !state.defeated[mobKey(z, m.id)])
        .forEach((m) => dot(m.x, m.y, "#ed9987", 4));
      interactables()
        .filter((i) => !i.hidden?.())
        .forEach((it) =>
          dot(
            it.x,
            it.y,
            it.travel ? "#c5dce0" : it.id === "rest" ? "#9bdda9" : "#b9bba1",
            4,
          ),
        );
      const ob = localObjective();
      if (ob) {
        const path = findPath(state.player, ob);
        ctx.strokeStyle = "#f9d98ccc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ox + state.player.x * sc, oy + state.player.y * sc);
        path.forEach((p) => ctx.lineTo(ox + p.x * sc, oy + p.y * sc));
        ctx.stroke();
        dot(ob.x, ob.y, UI_GOLD, 7);
      }
    }
    dot(state.player.x, state.player.y, "#fff7d1", details ? 6 : 3);
  }
}

function travelSelected() {
  const z = atlasSelection;
  if (z === state.zone) {
    overlay = null;
    return;
  }
  if (!adv().visited[z] || !isZoneUnlocked(z)) return;
  overlay = null;
  zoneTransition(z);
}

function drawMapOverlay() {
  modalFrame(
    "THE DISTRICT ATLAS",
    "Gold routes follow the story. Side districts reward permanent party relics. Rest to recover; revisit any unlocked district.",
  );
  uiButton("Connections", 58, 164, 183, 37, () => (atlasTab = "districts"), {
    active: atlasTab === "districts",
  });
  uiButton("Local map", 251, 164, 170, 37, () => (atlasTab = "local"), {
    active: atlasTab === "local",
  });
  if (atlasTab === "districts") {
    const point = (z) => {
      const p = DISTRICTS[z].at;
      return {
        x: p[0],
        y: p[1] === 150 || p[1] === 160 ? 270 : p[1] === 360 ? 422 : 562,
      };
    };
    for (const [a, b] of LINKS) {
      const p = point(a),
        q = point(b);
      ctx.strokeStyle =
        CORE_ZONES.includes(a) && CORE_ZONES.includes(b)
          ? "#c6ae74"
          : "#507581";
      ctx.lineWidth = 3;
      ctx.setLineDash(SIDE_MISSIONS[a] || SIDE_MISSIONS[b] ? [7, 6] : []);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const [z, d] of Object.entries(DISTRICTS)) {
      const p = point(z),
        visited = adv().visited[z],
        available = isZoneUnlocked(z),
        selected = atlasSelection === z,
        done = SIDE_MISSIONS[z] && sideState(z).complete;
      box(
        p.x - 91,
        p.y - 36,
        182,
        75,
        selected ? "#34524f" : available ? "#203e47" : "#19323b",
        selected ? UI_GOLD : visited ? "#85b0ad" : "#4b666e",
      );
      panelText(
        (done ? "✓ " : z === state.zone ? "● " : "") +
          "LV " +
          d.level +
          (SIDE_MISSIONS[z] ? " / SIDE" : " / STORY"),
        p.x - 77,
        p.y - 26,
        10,
        available ? d.color : "#617d86",
      );
      wrapped(
        d.name,
        p.x - 77,
        p.y - 4,
        160,
        12,
        available ? UI_INK : "#7f959b",
        2,
      );
      buttons.push({
        x: p.x - 91,
        y: p.y - 36,
        w: 182,
        h: 75,
        label:
          d.name +
          (visited ? " · visited" : available ? " · discover" : " · locked"),
        fn: () => (atlasSelection = z),
      });
    }
    const d = DISTRICTS[atlasSelection],
      visited = adv().visited[atlasSelection];
    panelText(d.name + " · " + d.tag, 60, 631, 13, d.color);
    panelText(
      atlasSelection === state.zone
        ? "You are here"
        : visited
          ? "Fast travel is available"
          : isZoneUnlocked(atlasSelection)
            ? "Enter from a connected district to unlock fast travel"
            : "Progress the main story to unlock this route",
      60,
      655,
      11,
      UI_MUTED,
    );
    uiButton(
      atlasSelection === state.zone
        ? "Return to world"
        : visited
          ? "Travel here →"
          : "Discover on foot",
      975,
      631,
      239,
      45,
      travelSelected,
      {
        disabled:
          atlasSelection !== state.zone &&
          (!visited || !isZoneUnlocked(atlasSelection)),
        active: true,
      },
    );
  } else {
    box(58, 218, 836, 441, "#203b41", "#5d7c7e");
    miniMap(65, 224, 820, 430, state.zone, true);
    text(DISTRICTS[state.zone].name, 924, 228, 16, UI_INK);
    wrapped(DISTRICTS[state.zone].tag, 924, 266, 270, 14, UI_MUTED, 2);
    [
      ["#f2d28c", "Objective & route"],
      ["#fff7d1", "Your party"],
      ["#8ce3d0", "People"],
      ["#ed9987", "Visible encounters"],
      ["#9bdda9", "Rest points"],
    ].forEach(([c, t], i) => {
      drawDiamond(934, 324 + i * 39, c, 5);
      panelText(t, 952, 316 + i * 39, 12, UI_INK);
    });
    wrapped(
      "All paths and obstacles match the world. Follow the gold route to your next objective.",
      924,
      542,
      280,
      13,
      UI_MUTED,
      4,
    );
  }
}
