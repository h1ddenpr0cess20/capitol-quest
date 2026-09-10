const MAPS = Object.fromEntries(
  Object.entries(DISTRICTS).map(([zone, d]) => [
    zone,
    {
      name: d.name,
      w: 1920,
      h: 1280,
      spawn: { x: d.spawn[0], y: d.spawn[1] },
      theme: d.theme,
      subtitle: d.tag,
    },
  ]),
);
const REST = Object.fromEntries(
  Object.entries(DISTRICTS).map(([zone, d]) => [
    zone,
    { x: d.rest[0], y: d.rest[1] },
  ]),
);
const ROOM_NAMES = Object.fromEntries(
  Object.entries(DISTRICTS).map(([zone, d], i) => [
    zone,
    String(i + 1).padStart(2, "0") + " / " + d.tag.toUpperCase(),
  ]),
);
const WORLD_ENCOUNTERS = Object.fromEntries(
  Object.entries(DISTRICTS).map(([zone, d]) => [
    zone,
    (
      d.mobs ||
      MOB_LAYOUT[zone] || [
        [d.nodes[0][0], d.nodes[0][1] + 100, "STUDENT"],
        [d.nodes[1][0] + 65, d.nodes[1][1], "SCIENTIST"],
        [d.nodes[2][0], d.nodes[2][1] + 110, "UNION"],
      ]
    ).map(([x, y, type], i) => ({
      id: "v6_" + i,
      x,
      y,
      type,
      level: d.level,
      partner: i === 1 ? "NURSE" : i === 2 ? "ACTIVIST" : "EVERYDAY",
    })),
  ]),
);
