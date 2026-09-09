function statusText(u) {
  const map = {
    atkUp: "ATK↑",
    defUp: "DEF↑",
    magUp: "MAG↑",
    atkDown: "ATK↓",
    defDown: "DEF↓",
    magDown: "MAG↓",
    vulnerable: "VULN",
    regen: "REGEN",
    mpRegen: "MP+",
  };
  return Object.keys(u.status || {})
    .map((k) => map[k])
    .filter(Boolean)
    .join(" ");
}

function panelText(s, x, y, size = 16, color = "#dce5f3", align = "left") {
  text(s, x, y, size, color, align, 500);
}

function wrapped(s, x, y, w, size = 16, color = "#b8c7da", lines = 3) {
  return wrap(s, x, y, w, size * 1.5, size, color, lines);
}

function text(
  s,
  x,
  y,
  size = 18,
  color = "#fff",
  align = "left",
  weight = 700,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "QuestMono", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(String(s), Math.round(x), Math.round(y));
}

function wrap(s, x, y, maxW, lineH, size = 17, color = "#fff", maxLines = 99) {
  ctx.font = `700 ${size}px "QuestMono", monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const words = String(s).split(" ");
  let line = "",
    yy = y,
    lines = 0;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillStyle = color;
      ctx.fillText(line, x, yy);
      yy += lineH;
      lines++;
      if (lines >= maxLines) return yy;
      line = word;
    } else line = test;
  }
  if (line && lines < maxLines) {
    ctx.fillStyle = color;
    ctx.fillText(line, x, yy);
    yy += lineH;
  }
  return yy;
}

function drawShadow(x, y, w = 28, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#0a1028";
  ctx.beginPath();
  ctx.ellipse(x, y, w, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDiamond(x, y, color = "#ffe970", r = 8) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

function box(x, y, w, h, fill = "#101d30", stroke = "#34465b") {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function pill(s, x, y, color = "#f8ce76") {
  const w = String(s).length * 8 + 20;
  box(x, y, w, 23, "#12263a", color);
  panelText(s, x + 10, y + 4, 12, color);
}

function uiButton(
  label,
  x,
  y,
  w,
  h,
  fn,
  { active = false, disabled = false, sub = "", accent = "#f8ce76" } = {},
) {
  const hot =
    pointer.x >= x && pointer.x < x + w && pointer.y >= y && pointer.y < y + h;
  box(
    x,
    y,
    w,
    h,
    active ? "#29364a" : hot && !disabled ? "#223148" : "#142238",
    active ? accent : "#3b4b60",
  );
  if (active) {
    ctx.fillStyle = accent;
    ctx.fillRect(x, y, 4, h);
  }
  panelText(
    label,
    x + 15,
    y + (sub ? 11 : (h - 17) / 2),
    16,
    disabled ? "#758295" : active ? accent : "#eef3fb",
  );
  if (sub) panelText(sub, x + 15, y + 36, 12, disabled ? "#758295" : "#a6b7ce");
  buttons.push({
    x,
    y,
    w,
    h,
    fn,
    disabled,
    label,
  });
}

function topLabel(kicker, title, sub = "") {
  panelText(kicker, 58, 45, 13, "#8da7bd");
  text(title, 58, 73, 32, "#f3f1e9");
  if (sub) panelText(sub, 58, 118, 15, "#b0bfd0");
}

function bar(x, y, w, h, value, max, color = "#95deb8") {
  ctx.fillStyle = "#334259";
  ctx.fillRect(x, y, w, h);
  const frac = clamp(max ? value / max : 0, 0, 1);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.round(w * frac), h);
}

function modalFrame(title, sub = "") {
  ctx.fillStyle = "#061820e8";
  ctx.fillRect(0, 0, W, H);
  box(34, 26, 1212, 668, "#112d37", "#617f80");
  panelText("CAPITOL QUEST / DISTRICTS OF DISCOVERY", 58, 46, 11, UI_MUTED);
  text(title, 58, 77, 29, UI_INK);
  if (sub) wrapped(sub, 58, 122, 1120, 14, UI_MUTED, 2);
  uiButton("Esc · Close", 1090, 44, 130, 39, () => {
    overlay = null;
    modal = null;
  });
}
