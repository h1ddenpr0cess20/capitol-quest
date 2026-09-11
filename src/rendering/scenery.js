// Scenery uses ground footprints for collision and a separate vertical rise.
// Tall art participates in the same foot-position sort as the party.
const sceneryFrames = new Map();
const SCENERY_RISE = {
  building: 120,
  glass: 115,
  studio: 80,
  train: 80,
  vault: 90,
  dais: 45,
  machine: 45,
  shelf: 82,
  wall: 40,
  bench: 40,
  desk: 54,
  depot: 55,
  tent: 70,
  column: 100,
  tree: 108,
  plant: 68,
  flag: 135,
  camera: 70,
  podium: 60,
  antenna: 185,
  kiosk: 100,
  crate: 34,
  monument: 165,
  rail: 30,
  garden: 12,
  water: 0,
  seal: 0,
  gap: 0,
};
const GROUND_OBJECTS = new Set(["water", "seal", "gap"]);
const SCENE_PALETTES = {
  outdoor: ["#45644a", "#c2b896", "#aea585", "#dacda8"],
  garden: ["#355b48", "#b2a987", "#9a9677", "#cec29e"],
  interior: ["#252e36", "#c2bca6", "#ada791", "#ded5b8"],
  archive: ["#302d30", "#82725d", "#76664f", "#b3a080"],
  press: ["#1b2938", "#415164", "#374759", "#697c8c"],
  hearing: ["#292e35", "#aa9676", "#978567", "#cbb895"],
  tunnel: ["#172932", "#34464e", "#2b3d45", "#5c7076"],
  roof: ["#111f32", "#53616e", "#475562", "#7b8992"],
  station: ["#253139", "#a69b81", "#958a72", "#c4b79a"],
  vault: ["#182a30", "#4d6366", "#405659", "#788f8a"],
};
function drawHeadingBackdrop() {
  if (battleBackdrop.width) {
    ctx.drawImage(battleBackdrop, 0, 0, W, H);
    ctx.fillStyle = "#07142677";
  } else ctx.fillStyle = "#172c43";
  ctx.fillRect(0, 0, W, H);
}
function sceneRect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function sceneText(g, s, x, y, size = 13, c = "#e8d8ab") {
  g.font = "700 " + size + "px QuestMono,monospace";
  g.fillStyle = c;
  g.textAlign = "center";
  g.fillText(s, x, y);
}
function sceneProp(g, k, x, foot, scale = 1) {
  const r = PROPS[k];
  if (!r || !propsAtlas.naturalWidth) return;
  g.drawImage(
    spriteFrame("props", propsAtlas, r),
    Math.round(x - (r[2] * scale) / 2),
    Math.round(foot - r[3] * scale),
    r[2] * scale,
    r[3] * scale,
  );
}
function sceneryFrame(o) {
  const [type, , , w, h, name = ""] = o,
    ready = !!propsAtlas.naturalWidth && !!landmarkAtlas.naturalWidth;
  const key = JSON.stringify([type, w, h, name, ready]);
  if (sceneryFrames.has(key)) return sceneryFrames.get(key);
  const rise = SCENERY_RISE[type] || 0,
    pad = type === "tree" ? 36 : type === "flag" ? 20 : 8,
    c = document.createElement("canvas");
  c.width = w + pad * 2;
  c.height = h + rise + pad * 2;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.translate(pad, pad);
  const r = (x, y, ww, hh, color) => sceneRect(g, x, y, ww, hh, color),
    label = (s, x, y, size = 12) => sceneText(g, s, x, y, size);
  const y = rise;
  // Ground shadow stays small enough to describe the actual contact area.
  if (!GROUND_OBJECTS.has(type)) r(4, y + 6, w, h, "#10232b55");
  const cabinet = (x, yy, ww, hh, metal = false) => {
    r(x, yy, ww, hh, "#192a30");
    r(x + 2, yy + 2, ww - 4, hh - 5, metal ? "#667d83" : "#936b45");
    r(x + 4, yy + 3, ww - 8, 8, metal ? "#a4b5b2" : "#c69962");
    r(x + ww - 7, yy + 11, 5, hh - 15, metal ? "#3e535d" : "#5c402f");
  };
  if (type === "water") {
    r(-4, y - 4, w + 8, h + 8, "#263e45");
    r(-2, y - 2, w + 4, h + 4, "#d1c6a0");
    r(5, y + 5, w - 10, h - 10, "#264a59");
    r(9, y + 9, w - 18, h - 18, "#397082");
    for (let yy = 18; yy < h - 12; yy += 18)
      for (let xx = 14; xx < w - 28; xx += 53)
        r(xx + (yy % 3) * 5, y + yy, 22, 2, "#8bb2ae");
    r(9, y + 9, w - 18, 5, "#203e4e");
  } else if (type === "gap") {
    r(0, y, w, h, "#091523");
    for (let yy = 20; yy < h; yy += 38)
      for (let xx = 12; xx < w; xx += 42) {
        r(xx, y + yy, 27, 25, "#152a3b");
        r(xx + 5, y + yy + 5, 5, 8, "#40556a");
      }
    r(0, y, w, 12, "#253945");
    r(0, y, 8, h, "#75828a");
    r(w - 8, y, 8, h, "#75828a");
  } else if (type === "seal") {
    g.strokeStyle = "#8e774e";
    g.lineWidth = 5;
    g.beginPath();
    g.ellipse(w / 2, y + h / 2, w / 2 - 6, h / 2 - 6, 0, 0, Math.PI * 2);
    g.stroke();
    sceneProp(g, "SEAL", w / 2, y + h / 2 + 45, 2);
  } else if (type === "garden") {
    r(0, y, w, h, "#203e35");
    r(0, y, w, 6, "#c8b994");
    r(0, y + h - 6, w, 6, "#7b785c");
    for (let yy = y + 12; yy < y + h - 10; yy += 22)
      for (let xx = 10; xx < w - 10; xx += 23) {
        r(xx, yy, 16, 12, "#294b34");
        r(xx + 2, yy - 3, 12, 10, "#65824d");
        r(xx + 4, yy - 3, 6, 3, "#92a363");
        if ((xx + yy) % 5 < 2) {
          r(xx + 7, yy, 4, 4, "#d8ab77");
          r(xx + 9, yy + 3, 4, 3, "#eed2a0");
        }
      }
  } else if (type === "tree") {
    const a = LAND.TREE;
    if (ready) {
      const sc = 2;
      g.drawImage(
        spriteFrame("landmarks", landmarkAtlas, a),
        w / 2 - (a[2] * sc) / 2,
        y + h - a[3] * sc,
        a[2] * sc,
        a[3] * sc,
      );
    }
  } else if (["column", "plant", "flag"].includes(type)) {
    sceneProp(
      g,
      { column: "COLUMN", plant: "POTPLANT", flag: "FLAG" }[type],
      w / 2,
      y + h,
      type === "column" ? 2 : type === "flag" ? 1.7 : 1.5,
    );
  } else if (type === "desk") {
    for (let xx = 62; xx < w; xx += 124) sceneProp(g, "DESK", xx, y + h, 2);
    r(16, y - 16, 29, 19, "#dbd1ae");
    r(19, y - 13, 20, 2, "#728488");
    r(72, y - 20, 30, 22, "#1d303c");
    r(76, y - 17, 22, 14, "#618b93");
  } else if (type === "bench") {
    r(9, y + h - 10, 9, 10, "#233239");
    r(w - 18, y + h - 10, 9, 10, "#233239");
    r(0, y - 20, w, 25, "#48372d");
    for (let yy = y - 17; yy < y + 3; yy += 8) {
      r(3, yy, w - 6, 5, "#b48b58");
      r(3, yy, w - 6, 2, "#d0a975");
    }
    r(0, y + 7, w, h - 17, "#a2784e");
    r(0, y + 7, w, 4, "#c49d66");
    r(0, y - 15, 5, h + 5, "#2e3c40");
    r(w - 5, y - 15, 5, h + 5, "#2e3c40");
  } else if (type === "shelf") {
    cabinet(0, 4, w, y + h - 4);
    for (let yy = 16; yy < y + h - 24; yy += 33) {
      r(7, yy, w - 17, 26, "#352d2a");
      for (let xx = 11; xx < w - 19; xx += 13) {
        const k = Math.floor(xx / 13 + yy / 33);
        r(
          xx,
          yy + 3 + (k % 3),
          9,
          21 - (k % 3),
          ["#a26f53", "#658387", "#b39b65", "#6c7459"][k % 4],
        );
        r(xx + 2, yy + 7, 5, 2, "#d1b990");
      }
      r(5, yy + 26, w - 11, 5, "#c0935b");
    }
  } else if (type === "crate" || type === "depot") {
    cabinet(0, y - 25, w, h + 25);
    r(8, y - 12, w - 20, h + 4, "#6b5038");
    for (let xx = 12; xx < w - 12; xx += 22) r(xx, y - 10, 3, h, "#b68c55");
    r(4, y - 22, w - 8, 6, "#dfba7a");
    r(4, y + h - 10, w - 8, 7, "#c29a60");
    if (name) {
      r(18, y, w - 36, 23, "#303e3d");
      label(name, w / 2, y + 16, 11);
    }
  } else if (type === "wall" || type === "rail") {
    r(0, y - 24, w, h + 24, "#344750");
    r(0, y - 24, w, 9, "#9aa79e");
    for (let yy = y - 12; yy < y + h; yy += 19) {
      r(0, yy, w, 2, "#21353e");
      for (let xx = (yy % 2) * 24; xx < w; xx += 48)
        r(xx, yy, 2, 19, "#253c45");
    }
    r(0, y + h - 4, w, 4, "#182e38");
  } else if (type === "tent") {
    r(6, y, w - 12, h, "#654938");
    r(12, y + 8, w - 24, h - 8, "#2c3c3c");
    for (let xx = 0; xx < w; xx += 20) {
      r(xx, y - 50, 20, 35, (xx / 20) % 2 ? "#d4bd8c" : "#577f71");
      r(xx, y - 15, 20, 15, (xx / 20) % 2 ? "#b9a67c" : "#3e675c");
    }
    r(4, y, w - 8, 23, "#805d3f");
    label(name, w / 2, y + 16, 11);
    r(8, y + 48, w - 16, 14, "#bb9059");
    r(12, y + 35, 30, 13, "#e7c986");
    r(65, y + 29, 22, 19, "#6d927c");
    r(113, y + 37, 31, 11, "#be7861");
  } else if (type === "camera") {
    r(w / 2 - 2, y - 20, 4, h + 20, "#101f2b");
    for (let i = 0; i < 16; i++) {
      r(w / 2 - i, y + h - 16 + i, 3, 2, "#263b46");
      r(w / 2 + i, y + h - 16 + i, 3, 2, "#263b46");
    }
    cabinet(0, y - 46, w, 28, true);
    r(w - 3, y - 40, 12, 16, "#13212c");
    r(5, y - 40, 13, 12, "#405568");
    r(3, y - 51, 6, 4, "#e26c5e");
  } else if (type === "podium" || type === "kiosk") {
    cabinet(
      0,
      type === "kiosk" ? 5 : y - 30,
      w,
      type === "kiosk" ? y + h - 5 : h + 30,
    );
    if (type === "kiosk") {
      r(7, 15, w - 14, 46, "#203743");
      label(name, w / 2, 43, 11);
      r(15, 70, w - 30, 24, "#668a83");
    } else {
      sceneProp(g, "SEAL", w / 2, y + h - 4, 1);
      r(w / 2 + 20, y - 49, 3, 22, "#263840");
      r(w / 2 + 12, y - 49, 12, 4, "#1b2a31");
    }
  } else if (type === "monument") {
    r(0, y, w, h, "#817e6b");
    r(5, y - 10, w - 10, 12, "#d2c7aa");
    r(w / 2 - 17, 18, 34, y - 28, "#d4c8a5");
    r(w / 2, 18, 17, y - 28, "#aba78d");
    for (let i = 0; i < 17; i++) r(w / 2 - i, 18 - i, 2 * i, 2, "#dbceaa");
    r(10, y + 10, w - 20, 26, "#b1a688");
  } else if (type === "antenna") {
    cabinet(0, y, w, h, true);
    r(w / 2 - 3, 0, 6, y, "#bac5b8");
    for (let yy = 30; yy < y; yy += 35) {
      r(w / 2 - 38, yy, 76, 4, "#8eaaa8");
      r(w / 2 - 38, yy - 8, 4, 20, "#526c77");
      r(w / 2 + 34, yy - 8, 4, 20, "#526c77");
    }
    r(w / 2 - 5, 0, 10, 8, "#f4ab77");
    r(13, y + 18, w - 26, h - 32, "#293f4b");
  } else if (type === "machine") {
    cabinet(0, 6, w, y + h - 6, true);
    r(10, 21, w - 22, 22, "#233b48");
    for (let xx = 16; xx < w - 20; xx += 13)
      r(xx, 26, 6, 10, xx % 3 ? "#89b69c" : "#deac64");
    for (let yy = 54; yy < y + h - 14; yy += 7) r(12, yy, w - 26, 3, "#304651");
    if (name) {
      r(8, y + h - 24, w - 18, 18, "#263b42");
      label(name, w / 2, y + h - 11, 9);
    }
  } else if (type === "train") {
    r(0, 9, w, y + h - 18, "#263b45");
    r(8, 3, w - 16, 24, "#bac2b7");
    r(4, 27, w - 8, y + h - 42, "#819b9d");
    r(4, y + 55, w - 8, 12, "#ab6854");
    for (let xx = 24; xx < w - 85; xx += 120) {
      r(xx, 39, 85, 57, "#233c49");
      r(xx + 4, 43, 77, 46, "#527281");
      r(xx + 8, 44, 8, 43, "#91aaa6");
      r(xx + 42, 43, 3, 47, "#b1b9a6");
      r(xx + 7, y + h - 12, 60, 12, "#182b35");
    }
    r(w / 2 - 38, 30, 76, y + h - 37, "#b0b9ae");
    r(w / 2 - 30, 40, 60, 45, "#324f5e");
    r(w / 2 - 1, 30, 3, y + h - 37, "#405d64");
    r(0, y + h - 5, w, 5, "#192d36");
    label(name, w / 2, y + 45, 13);
  } else if (["building", "glass", "studio", "vault", "dais"].includes(type)) {
    const stone = type === "building" || type === "glass",
      metal = type === "vault";
    const top = type === "dais" ? 8 : 6,
      height = y + h - top;
    cabinet(0, top, w, height, metal);
    r(4, top + 3, w - 8, 18, stone ? "#e0d2ae" : metal ? "#a6b8b1" : "#b28c5b");
    r(
      8,
      top + 21,
      w - 16,
      height - 35,
      stone
        ? "#aaab98"
        : metal
          ? "#3f5660"
          : type === "studio"
            ? "#253f51"
            : "#5d4334",
    );
    if (stone) {
      for (let xx = 24; xx < w - 38; xx += 58) {
        r(xx, top + 40, 38, height - 79, "#344f59");
        r(
          xx + 4,
          top + 45,
          30,
          height - 90,
          type === "glass" ? "#7ba4a0" : "#5f7e82",
        );
        r(xx + 17, top + 40, 4, height - 79, "#c3c2a5");
        r(xx, top + 83, 38, 4, "#b6b99f");
      }
      if (type === "building")
        for (let xx = 18; xx < w - 20; xx += 116) {
          r(xx, top + 30, 14, height - 40, "#ddd1b1");
          r(xx - 4, top + 26, 22, 8, "#efe0bd");
          r(xx - 4, y + h - 19, 22, 10, "#c0b393");
        }
      r(w / 2 - 46, y + h - 92, 92, 92, "#d0c4a2");
      sceneProp(g, "DOOR", w / 2, y + h, 1.25);
      for (let i = 0; i < 3; i++) {
        r(
          -i * 2,
          y + h - 8 + i * 3,
          w + i * 4,
          3,
          i % 2 ? "#8d8d7a" : "#d3c9ab",
        );
      }
    } else if (type === "vault") {
      for (let xx = 18; xx < w - 24; xx += 40) {
        r(xx, top + 36, 4, 4, "#a4beb4");
        r(xx, y + h - 15, 4, 4, "#a4beb4");
      }
      const cx = w / 2,
        cy = y + h / 2;
      g.fillStyle = "#7d9798";
      g.beginPath();
      g.ellipse(cx, cy, 62, 67, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#b6c4b5";
      g.lineWidth = 5;
      g.stroke();
      g.strokeStyle = "#2e4a55";
      g.lineWidth = 8;
      g.beginPath();
      g.arc(cx, cy, 22, 0, Math.PI * 2);
      g.stroke();
      r(cx - 3, cy - 36, 6, 72, "#c7c9ae");
      r(cx - 36, cy - 3, 72, 6, "#c7c9ae");
    } else if (type === "dais") {
      for (let xx = 65; xx < w - 40; xx += 110)
        sceneProp(g, "CHAIR", xx, y + 25, 1.3);
      r(8, y + 12, w - 16, h - 15, "#926642");
      r(8, y + 12, w - 16, 7, "#d1a268");
      for (let xx = 21; xx < w - 25; xx += 78) {
        r(xx, y + 30, 60, h - 40, "#684a34");
        r(xx + 3, y + 33, 54, 3, "#b28853");
      }
      sceneProp(g, "SEAL", w / 2, y + h - 8, 1.4);
    } else {
      for (let xx = 25; xx < w - 65; xx += 85) {
        r(xx, 42, 65, 59, "#101e2c");
        r(xx + 4, 46, 57, 48, "#3f6a7a");
        r(xx + 8, 52, 20, 3, "#a6c0b3");
        r(xx + 8, 60, 41, 2, "#789991");
        r(xx + 8, 78, 31, 5, "#bd8b6c");
      }
      sceneProp(g, "DESK", w / 2, y + h - 12, 2);
    }
    if (name) {
      const sz = Math.min(13, Math.floor((w - 24) / (name.length * 0.62)));
      r(10, top + 21, w - 20, 23, "#20353b");
      label(name, w / 2, top + 37, sz);
    }
  }
  const frame = { canvas: c, rise, pad };
  sceneryFrames.set(key, frame);
  return frame;
}
function drawSceneryObject(g, o) {
  const f = sceneryFrame(o);
  g.drawImage(f.canvas, o[1] - f.pad, o[2] - f.rise - f.pad);
}
function districtScene(z, overview = false) {
  const ready = !!propsAtlas.naturalWidth && !!landmarkAtlas.naturalWidth;
  const key = z + ":" + ready + ":" + overview;
  if (districtCanvases.has(key)) return districtCanvases.get(key);
  const d = DISTRICTS[z],
    p = SCENE_PALETTES[d.theme],
    out = ["outdoor", "garden"].includes(d.theme),
    dark = ["tunnel", "roof", "vault", "press"].includes(d.theme);
  const c = document.createElement("canvas");
  c.width = 1920;
  c.height = 1280;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const r = (x, y, w, h, color) => sceneRect(g, x, y, w, h, color);
  r(0, 0, 1920, 1280, p[0]);
  if (out) {
    for (let i = 0; i < 2700; i++) {
      const x = (i * 137 + z.length * 91) % 1920,
        y = (i * 359 + 17) % 1280;
      r(x, y, 2, 3, i % 3 ? "#6d835133" : "#142f2333");
    }
  } else {
    r(70, 100, 1780, 1120, p[1]);
    const size = d.theme === "hearing" ? 64 : d.theme === "press" ? 48 : 80;
    for (let yy = 100; yy < 1220; yy += size)
      for (let xx = 70; xx < 1850; xx += size) {
        r(
          xx + 1,
          yy + 1,
          size - 2,
          size - 2,
          ((xx - 70) / size + (yy - 100) / size) % 2 ? p[1] : p[1],
        );
        r(xx + 3, yy + 3, size - 6, 1, p[3] + "25");
      }
  }
  // Union the path beds before their surfaces so intersections have no seams.
  for (const [x, y, w, h] of d.roads)
    r(x - 6, y - 6, w + 12, h + 12, out ? "#8c8c6c" : p[2]);
  for (const [x, y, w, h] of d.roads) r(x, y, w, h, out ? p[1] : p[2]);
  g.save();
  g.beginPath();
  d.roads.forEach(([x, y, w, h]) => g.rect(x, y, w, h));
  g.clip();
  if (out) {
    for (let yy = 100; yy < 1220; yy += 32) {
      r(70, yy, 1780, 1, "#766f573b");
      for (let xx = 70 + (yy % 64 ? 32 : 0); xx < 1850; xx += 64)
        r(xx, yy, 1, 32, "#766f573b");
    }
  } else if (["interior", "hearing"].includes(d.theme)) {
    r(845, 360, 230, 850, d.theme === "hearing" ? "#69433f" : "#49636a");
    r(856, 360, 3, 850, "#bd9a60");
    r(1061, 360, 3, 850, "#bd9a60");
  } else if (dark) {
    for (let yy = 180; yy < 1180; yy += 160) r(70, yy, 1780, 2, p[3] + "45");
  }
  g.restore();
  if (z === "ROTUNDA") {
    g.strokeStyle = "#8e825f";
    g.lineWidth = 9;
    g.beginPath();
    g.ellipse(960, 710, 485, 315, 0, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(960, 710, 466, 296, 0, 0, Math.PI * 2);
    g.stroke();
  }
  if (z === "STATION") {
    r(250, 180, 1430, 4, "#364a51");
    r(250, 209, 1430, 4, "#364a51");
    r(230, 404, 1440, 8, "#d7b969");
    for (let xx = 240; xx < 1660; xx += 16) r(xx, 414, 6, 4, "#d7b969");
  }
  if (z === "TUNNELS") {
    for (let yy = 175; yy < 260; yy += 23) {
      r(95, yy, 1680, 10, "#253a43");
      r(95, yy, 1680, 3, "#7b8b81");
    }
  }
  // A visible, continuous boundary agrees with worldSolids.
  r(60, 90, 1800, 12, p[3]);
  r(60, 102, 1800, 38, out ? "#294936" : dark ? "#243b48" : "#6b7169");
  r(60, 100, 10, 1120, p[3]);
  r(1850, 100, 10, 1120, p[3]);
  r(60, 1220, 1800, 10, p[3]);
  if (!out)
    for (let xx = 155; xx < 1790; xx += 240) {
      r(xx, 108, 90, 18, dark ? "#506978" : "#a5b4aa");
      r(xx + 8, 110, 74, 3, dark ? "#b8d0ba" : "#ddd5b8");
    }
  for (const [x, y, s] of d.signs || [])
    sceneText(g, s, x, y, 12, out ? "#e3d8af" : "#e0c995");
  for (const o of d.objects)
    if (GROUND_OBJECTS.has(o[0])) drawSceneryObject(g, o);
  if (overview)
    for (const o of [...d.objects].sort((a, b) => a[2] + a[4] - b[2] - b[4]))
      if (!GROUND_OBJECTS.has(o[0])) drawSceneryObject(g, o);
  districtCanvases.set(key, c);
  return c;
}
function drawMapBase(z) {
  ctx.drawImage(districtScene(z), 0, 0);
}
function sceneryEntities(z) {
  return DISTRICTS[z].objects
    .filter((o) => !GROUND_OBJECTS.has(o[0]))
    .map((o) => ({ y: o[2] + o[4], draw: () => drawSceneryObject(ctx, o) }));
}
function fieldObjectType(it) {
  if (it.travel) return null;
  if (it.id === "rest") return "medical";
  if (it.id === "cache") return "crate";
  if (
    it.id === "travel" ||
    it.id === "trials" ||
    it.id === "briefing" ||
    it.id === "tutorial" ||
    it.id === "upgrade"
  )
    return "board";
  if (it.id.startsWith("breaker") || it.id === "channel") return "terminal";
  if (it.id.startsWith("mission_") && it.id !== "mission_boss")
    return ["TUNNELS", "ROOFTOPS", "VAULT"].includes(state.zone)
      ? "terminal"
      : "crate";
  if (it.boss || ["sentinel", "fixer", "chair"].includes(it.id)) return null;
  return "document";
}
function drawFieldObject(it) {
  const boss =
    { sentinel: "SENTINEL", fixer: "FIXER", chair: "CHAIR" }[it.id] ||
    (it.id === "mission_boss" ? SIDE_MISSIONS[state.zone]?.boss : null);
  if (boss) {
    drawShadow(it.x, it.y, 23, 0.22);
    drawFacingEnemy(
      ENEMY_DEFS[boss].sprite,
      it.x,
      it.y,
      0.78,
      state.player.x < it.x ? "left" : "right",
    );
    return;
  }
  const type = fieldObjectType(it);
  if (!type) return;
  const x = it.x,
    y = it.y,
    r = (a, b, w, h, c) => sceneRect(ctx, x + a, y + b, w, h, c);
  if (type === "crate")
    drawSceneryObject(ctx, ["crate", x - 24, y - 24, 48, 24]);
  else if (type === "medical") {
    r(-25, -38, 50, 35, "#d6d4b8");
    r(-25, -38, 50, 6, "#7aa396");
    r(-20, -4, 6, 6, "#263f43");
    r(14, -4, 6, 6, "#263f43");
    r(-4, -31, 8, 21, "#ac524e");
    r(-10, -25, 20, 8, "#ac524e");
  } else if (type === "terminal") {
    r(-19, -55, 38, 49, "#68828a");
    r(-15, -50, 30, 25, "#142e3e");
    r(-11, -46, 22, 3, "#9fce9f");
    r(-11, -39, 14, 3, "#9fce9f");
    r(-13, -19, 7, 5, "#d4a568");
    r(3, -19, 7, 5, "#8bbc9c");
    r(-24, -6, 48, 6, "#30494f");
  } else if (type === "board") {
    r(-22, -59, 44, 40, "#ba955f");
    r(-18, -55, 36, 32, "#304b4c");
    r(-19, -19, 5, 19, "#6c5239");
    r(14, -19, 5, 19, "#6c5239");
    r(-12, -48, 24, 3, "#d8cda5");
    r(-12, -40, 18, 2, "#92b9a3");
    r(-12, -33, 21, 2, "#92b9a3");
  } else {
    r(-17, -19, 34, 16, "#69533c");
    r(-13, -25, 26, 17, "#e1d3af");
    r(-9, -21, 17, 2, "#728483");
    r(-9, -16, 12, 2, "#728483");
  }
}
function drawMapObjects() {
  const ob = localObjective();
  for (const it of interactables()) {
    if (it.hidden?.()) continue;
    const near = dist(it, state.player) < 155,
      rest = it.id === "rest",
      exit = !!it.travel;
    const active = ob && dist(it, ob) < 12,
      c = rest ? "#a6e5bb" : active ? "#f6d785" : exit ? "#b7cfdb" : "#baaf89";
    if (near || active || exit || rest) {
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(it.x, it.y + 4, exit ? 25 : 20, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (exit) {
      sceneRect(ctx, it.x - 18, it.y - 4, 36, 5, c);
      drawDiamond(it.x, it.y - 25, c, 7);
    }
    if (active)
      drawDiamond(it.x, it.y - 76 + Math.sin(totalTime * 3) * 3, c, 6);
  }
  // Story witnesses are NPCs, so they are not in the interactables loop above.
  if (ob && npcList().some((n) => dist(n, ob) < 12)) {
    ctx.strokeStyle = "#f6d785";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ob.x, ob.y + 5, 28, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawDiamond(ob.x, ob.y - 110 + Math.sin(totalTime * 3) * 3, "#f6d785", 7);
  }
  if (walkPath.length) {
    ctx.fillStyle = "#fff0b6";
    for (let i = 0; i < walkPath.length; i += 3) {
      const p = walkPath[i];
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
  }
  const focus = worldFocusLabel();
  if (focus) {
    box(focus.x, focus.y, focus.w, focus.h, "#132d35ee", focus.color);
    panelText(
      focus.label,
      focus.x + focus.w / 2,
      focus.y + 6,
      11,
      focus.color,
      "center",
    );
  }
}
function drawStoryBackdrop(...args) {
  return drawHeadingBackdrop(...args);
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
