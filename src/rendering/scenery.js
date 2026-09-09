function drawHeadingBackdrop() {
  if (battleBackdrop.width) {
    ctx.drawImage(battleBackdrop, 0, 0, W, H);
    ctx.fillStyle = "#07142677";
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = "#172c43";
    ctx.fillRect(0, 0, W, H);
  }
}

function tileRect(key, x, y, w, h, size = 64) {
  const r = TILE[key];
  if (!atlasReady || !r) return;
  const cacheKey = key + ":" + r.join(",") + ":" + size;
  let pattern = tilePatterns.get(cacheKey);
  if (!pattern) {
    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const tc = tile.getContext("2d");
    tc.imageSmoothingEnabled = false;
    tc.drawImage(atlas, ...r, 0, 0, size, size);
    pattern = ctx.createPattern(tile, "repeat");
    tilePatterns.set(cacheKey, pattern);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function districtScene(z) {
  const ready = [atlas, landmarkAtlas, propsAtlas].every(
    (im) => im.complete && im.naturalWidth,
  );
  const key = z + ready;
  if (districtCanvases.has(key)) return districtCanvases.get(key);
  const c = document.createElement("canvas");
  c.width = 1920;
  c.height = 1280;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const d = DISTRICTS[z],
    out = ["outdoor", "garden"].includes(d.theme),
    roof = d.theme === "roof",
    dark = ["tunnel", "vault"].includes(d.theme);
  const fill = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    },
    line = (x, y, w, h, color) => {
      g.strokeStyle = color;
      g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, w - 2, h - 2);
    },
    label = (s, x, y, size = 16, color = "#e7ddbb") => {
      g.font = "700 " + size + "px QuestMono,monospace";
      g.fillStyle = color;
      g.textAlign = "center";
      g.fillText(s, x, y);
    };
  const prop = (k, x, y, w, h) => {
    const r = PROPS[k];
    if (!ready || !r) return;
    const sc = Math.min(w / r[2], h / r[3]);
    g.drawImage(
      spriteFrame("props", propsAtlas, r),
      x + (w - r[2] * sc) / 2,
      y + h - r[3] * sc,
      r[2] * sc,
      r[3] * sc,
    );
  };
  const tree = (x, y, scale = 1.4) => {
    const r = LAND.TREE;
    if (ready)
      g.drawImage(
        spriteFrame("landmarks", landmarkAtlas, r),
        x,
        y,
        r[2] * scale,
        r[3] * scale,
      );
  };
  const tile = (k, x, y, w, h, size) => {
    const r = TILE[k];
    if (!ready || !r) return;
    const p = document.createElement("canvas");
    p.width = size;
    p.height = size;
    const pg = p.getContext("2d");
    pg.imageSmoothingEnabled = false;
    pg.drawImage(atlas, ...r, 0, 0, size, size);
    g.save();
    g.translate(x, y);
    g.fillStyle = g.createPattern(p, "repeat");
    g.fillRect(0, 0, w, h);
    g.restore();
  };
  fill(
    0,
    0,
    1920,
    1280,
    out ? "#476f52" : roof ? "#454f66" : dark ? "#303f4a" : "#8e928f",
  );
  if (out) {
    for (let i = 0; i < 3700; i++) {
      const x = (i * 131 + z.length * 93) % 1920,
        y = (i * 397 + z.charCodeAt(0)) % 1280;
      fill(
        x,
        y,
        3 + (i % 4),
        2,
        i % 3 === 0 ? "#587f5b" : i % 3 === 1 ? "#3f684c" : "#4c7452",
      );
    }
    for (let y = 140; y < 1200; y += 145) {
      tree(85, y, 1.3);
      tree(1770, y + 35, 1.5);
    }
    for (let x = 260; x < 1700; x += 140) tree(x, 80, 1.2);
  } else {
    tile("floor", 70, 100, 1780, 1110, 48);
    fill(
      70,
      100,
      1780,
      1110,
      dark ? "#10212b99" : roof ? "#34446499" : "#79644833",
    );
    for (let y = 100; y < 1210; y += 96) {
      fill(70, y, 1780, 2, dark ? "#758e8f33" : "#d8d2b64d");
    }
    for (let x = 70; x < 1850; x += 96)
      fill(x, 100, 2, 1110, dark ? "#758e8f33" : "#d8d2b64d");
  }
  for (const [x, y, w, h] of d.roads) {
    fill(
      x - 9,
      y - 9,
      w + 18,
      h + 18,
      out ? "#b5b39a" : dark ? "#5c7178" : "#c7c2aa",
    );
    fill(
      x - 5,
      y - 5,
      w + 10,
      h + 10,
      out ? "#797d6e" : dark ? "#293943" : "#555e64",
    );
    tile("paving", x, y, w, h, 40);
    fill(
      x,
      y,
      w,
      h,
      out ? "#dbcaa022" : dark ? "#142936aa" : roof ? "#34415799" : "#a8916230",
    );
  }
  if (!out) {
    fill(70, 98, 1780, 27, dark ? "#586e78" : "#d4ccb6");
    fill(70, 125, 1780, 35, dark ? "#243644" : "#616a6c");
    fill(70, 100, 28, 1110, "#283e48");
    fill(1822, 100, 28, 1110, "#283e48");
    fill(70, 1186, 1780, 24, "#263c48");
    for (let x = 200; x < 1800; x += 300) {
      prop("POTPLANT", x, 165, 50, 70);
      prop("FLAG", x + 100, 146, 45, 105);
    }
  }
  for (const o of d.objects) {
    const [type, x, y, w, h, name] = o;
    fill(x + 9, y + 12, w, h, "#12283044");
    if (type === "garden") {
      fill(x - 5, y - 5, w + 10, h + 10, "#bfbb99");
      fill(x, y, w, h, "#32553f");
      for (let xx = x + 16; xx < x + w - 35; xx += 70) {
        tree(xx, y + 8, 1.25);
        for (let yy = y + 80; yy < y + h - 8; yy += 18)
          fill(xx + 8, yy, 4, 4, xx % 3 ? "#d6b695" : "#d7bc76");
      }
    } else if (type === "water") {
      fill(x - 6, y - 6, w + 12, h + 12, "#c1b89a");
      fill(x - 2, y - 2, w + 4, h + 4, "#607f84");
      fill(x, y, w, h, "#365f72");
      for (let yy = y + 12; yy < y + h; yy += 20) {
        fill(x + 8, yy, w - 16, 2, "#789b9944");
        for (let xx = x + 16; xx < x + w - 20; xx += 61)
          fill(xx + (yy % 7), yy + 7, 22, 2, "#a7c6b47a");
      }
    } else if (
      [
        "building",
        "glass",
        "studio",
        "train",
        "machine",
        "vault",
        "dais",
      ].includes(type)
    ) {
      const metal = ["machine", "vault", "train"].includes(type),
        stone = ["building", "glass"].includes(type);
      fill(x, y, w, h, metal ? "#536776" : stone ? "#c5c3af" : "#785849");
      fill(x, y, w, 20, metal ? "#a2b4b0" : stone ? "#e7dcc0" : "#b5916c");
      fill(
        x + 12,
        y + 25,
        w - 24,
        h - 38,
        metal ? "#344953" : stone ? "#aaa995" : "#553e35",
      );
      if (type === "building" || type === "glass") {
        for (let xx = x + 30; xx < x + w - 50; xx += 75) {
          fill(
            xx,
            y + 50,
            45,
            h - 88,
            type === "glass" ? "#719ea3" : "#6a8088",
          );
          fill(xx + 20, y + 50, 4, h - 88, "#c5c8ab");
          fill(xx, y + 85, 45, 4, "#c5c8ab");
        }
        fill(x + w / 2 - 47, y + h - 82, 94, 82, "#5c625b");
        fill(x + w / 2 - 38, y + h - 75, 76, 75, "#314955");
        fill(x + w / 2 - 2, y + h - 75, 4, 75, "#bdaf83");
      } else if (type === "vault") {
        prop("DOOR", x + w / 2 - 45, y + 35, 90, h - 35);
        for (let xx = x + 30; xx < x + w - 30; xx += 70)
          fill(xx, y + 46, 5, 5, "#adcba3");
      } else if (type === "dais") {
        for (let xx = x + 65; xx < x + w - 60; xx += 170)
          prop("CHAIR", xx, y + 55, 65, h - 60);
        prop("SEAL", x + w / 2 - 36, y + 36, 72, 72);
      } else if (type === "train") {
        for (let xx = x + 26; xx < x + w - 80; xx += 110) {
          fill(xx, y + 45, 77, 60, "#9baea3");
          fill(xx + 6, y + 51, 65, 48, "#354f5e");
        }
        fill(x + 15, y + h - 23, w - 30, 7, "#cbb982");
      } else {
        for (let xx = x + 30; xx < x + w - 70; xx += 100) {
          fill(xx, y + 50, 62, 55, "#142d3f");
          fill(
            xx + 6,
            y + 57,
            50,
            29,
            type === "machine" ? "#779f95" : "#7799b1",
          );
          fill(xx + 8, y + 94, 5, 4, "#e0bf73");
        }
        if (type === "studio") prop("DESK", x + 65, y + h - 80, w - 130, 78);
      }
      fill(x, y + h - 8, w, 8, "#222f34");
      if (name) {
        fill(x + 12, y + 23, w - 24, 27, "#223b42");
        label(name, x + w / 2, y + 42, 13, "#e5d5aa");
      }
    } else if (type === "shelf") {
      fill(x, y, w, h, "#583f33");
      for (let yy = y + 8; yy < y + h - 12; yy += 46) {
        for (let xx = x + 10; xx < x + w - 15; xx += 15) {
          fill(
            xx,
            yy,
            10,
            30,
            ["#a58459", "#738d8d", "#ae7863", "#597681"][(xx + yy) % 4],
          );
        }
        fill(x + 4, yy + 32, w - 8, 6, "#b28b5e");
      }
      line(x, y, w, h, "#362f2d");
    } else if (type === "wall") {
      fill(x, y, w, h, "#586a70");
      fill(x, y, w, 12, "#97aaa1");
      for (let yy = y + 22; yy < y + h; yy += 24)
        fill(x + 4, yy, w - 8, 2, "#344b55");
    } else if (type === "column") {
      prop("COLUMN", x, y, w, h);
    } else if (type === "seal") {
      prop("SEAL", x, y, w, h);
    } else if (type === "tent") {
      fill(x, y + 20, w, h - 20, "#81544b");
      fill(x, y, w, 28, "#d4c9a8");
      for (let xx = x; xx < x + w; xx += 40) fill(xx, y, 20, 28, "#568b83");
      fill(x + 40, y + 46, w - 80, h - 46, "#324b4a");
      label(name, x + w / 2, y + 46, 13);
    } else {
      fill(x, y, w, h, "#674b3a");
      fill(x, y, w, 12, "#b79569");
      fill(x + 10, y + 22, w - 20, 10, "#8f6d4c");
      if (type === "desk")
        for (let xx = x + 20; xx < x + w - 25; xx += 65)
          fill(xx, y + 15, 30, 20, "#dad1ae");
      if (name) label(name, x + w / 2, y + 46, 12);
    }
  }
  for (const [x, y] of [
    [130, 870],
    [1730, 890],
    [750, 1100],
    [1350, 1100],
  ]) {
    fill(x, y - 63, 4, 66, "#253e43");
    fill(x - 8, y - 64, 20, 5, "#e1c881");
    fill(x - 4, y - 59, 12, 15, "#f0d9a1");
    fill(x - 9, y, 23, 6, "#31484a");
  }
  fill(0, 0, 1920, 80, "#203c39");
  districtCanvases.set(key, c);
  return c;
}

function drawMapBase(z) {
  ctx.drawImage(districtScene(z), 0, 0);
}

function drawMapObjects(z) {
  const ob = localObjective();
  for (const it of interactables()) {
    if (it.hidden?.()) continue;
    const isRest = it.id === "rest",
      isExit = !!it.travel,
      near = dist(it, state.player) < 210,
      c = isRest
        ? "#a6e5bb"
        : isExit
          ? "#adcbd9"
          : it.boss
            ? "#eea18e"
            : "#eed394";
    ctx.save();
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(it.x, it.y + 5, isExit ? 31 : 22, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (it.icon) drawItem(it.icon, it.x, it.y - 22, 30);
    else if (isExit) {
      drawDiamond(it.x, it.y - 26, c, 9);
      panelText("↗", it.x, it.y - 48, 17, c, "center");
    } else drawDiamond(it.x, it.y - 35, c, 6);
    if (near || isRest || isExit) {
      const label = isRest
        ? "REST"
        : isExit
          ? (SIDE_MISSIONS[it.travel] ? "SIDE / " : "TO / ") + it.label
          : it.label;
      const w = Math.min(320, label.length * 7.3 + 24);
      box(it.x - w / 2, it.y + 20, w, 25, "#173033ef", c);
      panelText(label, it.x, it.y + 26, 11, c, "center");
    }
  }
  if (ob) {
    ctx.strokeStyle = "#f7d986";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(
      ob.x,
      ob.y + 9,
      34 + Math.sin(totalTime * 3) * 3,
      13,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  if (walkPath.length) {
    ctx.fillStyle = "#fff0b6";
    for (let i = 0; i < walkPath.length; i += 3) {
      const p = walkPath[i];
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
  }
}

function drawStoryBackdrop(...args) {
  return drawHeadingBackdrop(...args);
}
