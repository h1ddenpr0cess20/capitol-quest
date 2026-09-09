// Remove exterior matte fringe while retaining the dark outline beneath it.
// This is a single pass against the original pixels, never recursive erosion.
export function actorMaskRuns(data, width, height, key) {
  const remove = new Uint8Array(width * height);
  const opaque = (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    data[(y * width + x) * 4 + 3] > 0;
  const neighbors = (x, y) => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if ((dx || dy) && opaque(x + dx, y + dy)) count++;
    return count;
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const p = y * width + x,
        i = p * 4;
      if (!data[i + 3] || neighbors(x, y) === 8) continue;
      const [r, g, b] = data.slice(i, i + 3),
        max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      // Colored hair, skin, fabric and bright highlights are not background.
      if (min <= 45 || max >= 205 || max - min >= 65 || (r - g > 22 && g >= b))
        continue;
      const value = (r + g + b) / 3;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (!opaque(nx, ny) || neighbors(nx, ny) < 6) continue;
        const j = (ny * width + nx) * 4,
          inner = (data[j] + data[j + 1] + data[j + 2]) / 3;
        if (inner < value * 0.62 && value - inner >= 24) {
          remove[p] = 1;
          break;
        }
      }
    }
  // Reviewed source-background islands. Color tests preserve the adjoining
  // shirt, hand, wooden pole, money bag, rifle and actual muzzle flash.
  const regions = {
    "enemy/PROTESTER/0": [[53, 38, 19, 14, "taupe"]],
    "enemy/FARMER/0": [
      [44, 35, 19, 26, "taupe"],
      [49, 74, 12, 42, "slate"],
    ],
    "action/LUTNICK/1": [[45, 7, 35, 29, "taupe"]],
    "action/HEGSETH/2": [[77, 0, 46, 49, "smoke"]],
  };
  for (const [rx, ry, rw, rh, profile] of regions[key] || []) {
    for (let y = ry; y < Math.min(height, ry + rh); y++)
      for (let x = rx; x < Math.min(width, rx + rw); x++) {
        const p = y * width + x,
          i = p * 4,
          [r, g, b] = data.slice(i, i + 3);
        if (!data[i + 3]) continue;
        const max = Math.max(r, g, b),
          min = Math.min(r, g, b);
        const matte =
          profile === "taupe"
            ? min > 48 &&
              max < 175 &&
              r >= g &&
              r - g < 45 &&
              Math.abs(g - b) < 24
            : profile === "slate"
              ? min > 35 &&
                max < 125 &&
                b >= r &&
                b - r < 24 &&
                Math.abs(r - g) < 18
              : min > 42 && max < 172 && r >= g && g > b && max - min < 86;
        if (matte) remove[p] = 1;
      }
  }
  if (key === "action/RFK/2") {
    for (let x = 2; x < 20; x++) remove[x] = 1;
    for (let x = 38; x < 57; x++) remove[x] = 1;
  }
  // Empty spaces bounded by the artwork. Coordinates are in the original
  // frame, so masks cannot shift an animation frame or its ground anchor.
  const holes = {
    "action/LUTNICK/1": [
      [
        [48, 0],
        [80, 0],
        [80, 17],
        [48, 17],
      ],
      [
        [76, 17],
        [80, 17],
        [80, 30],
        [76, 30],
      ],
    ],
    "enemy/SENIOR/0": [
      [
        [44, 79],
        [49, 78],
        [49, 91],
        [44, 91],
      ],
      [
        [62, 78],
        [69, 76],
        [69, 89],
        [58, 91],
        [58, 80],
      ],
      [
        [18, 101],
        [22, 101],
        [22, 112],
        [20, 113],
        [17, 110],
      ],
    ],
  };
  for (const polygon of holes[key] || []) {
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [xi, yi] = polygon[i],
            [xj, yj] = polygon[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
            inside = !inside;
        }
        if (inside) remove[y * width + x] = 1;
      }
  }
  const runs = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width;) {
      if (!remove[y * width + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < width && remove[y * width + x]) x++;
      runs.push([start, y, x - start]);
    }
  return runs;
}
