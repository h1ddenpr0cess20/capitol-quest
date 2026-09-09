const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const lerp = (a, b, t) => a + (b - a) * t;

const choice = (a) => a[Math.floor(Math.random() * a.length)];

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const rectContains = (r, x, y, m = 0) =>
  x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
