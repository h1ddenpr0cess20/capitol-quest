import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import vm from "node:vm";
import { createCanvas, Image, GlobalFonts } from "@napi-rs/canvas";

GlobalFonts.registerFromPath(resolve("assets/QuestMono.ttf"), "QuestMono");
GlobalFonts.registerFromPath(resolve("assets/QuestMono-Bold.ttf"), "QuestMono");

function element() {
  return {
    listeners: {},
    children: [],
    style: {},
    setAttribute() {},
    addEventListener(type, fn) {
      (this.listeners[type] ||= []).push(fn);
    },
    replaceChildren(...children) {
      this.children = children;
    },
    click() {
      this.onclick?.();
    },
    setPointerCapture() {},
    focus() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 1280, height: 720 };
    },
  };
}

export async function loadGame({
  baseline = false,
  masks = true,
  storage = new Map(),
  seed,
} = {}) {
  let rngState = seed >>> 0;
  const random =
    seed === undefined
      ? () => 0.5
      : () => {
          rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
          return rngState / 4294967296;
        };
  const canvas = Object.assign(createCanvas(1280, 720), element());
  const elements = new Map([["game", canvas]]);
  const pending = [];
  class LocalImage extends Image {
    set src(value) {
      pending.push(
        new Promise((resolveLoad, reject) => {
          const callback = this.onload;
          this.onload = () => {
            callback?.();
            resolveLoad();
          };
          this.onerror = reject;
          super.src = readFileSync(resolve(value));
        }),
      );
    }
  }
  const window = element();
  const document = {
    ...element(),
    hidden: false,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElement(tag) {
      return tag === "canvas" ? createCanvas(1, 1) : element();
    },
  };
  const context = vm.createContext({
    window,
    document,
    Image: LocalImage,
    console,
    performance: { now: () => 0 },
    location: { search: "" },
    URLSearchParams,
    URL,
    Blob,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    requestAnimationFrame() {},
    setInterval() {},
    setTimeout() {},
    Math: Object.assign(Object.create(Math), { random }),
  });
  const files = baseline
    ? [
        "assets/props.js",
        "assets/extras.js",
        "game.js",
        "overhaul.js",
        "world.js",
        "progression.js",
        "interface.js",
      ]
    : ["dist/game.js"];
  for (const file of files)
    vm.runInContext(
      baseline
        ? execFileSync(
            "git",
            ["show", `51699e75f6b075c1be0fa56be0e4736ac7ee31e5:${file}`],
            { encoding: "utf8" },
          )
        : readFileSync(file, "utf8").replace(
            /\}\)\(\);\s*$/,
            masks
              ? "})();"
              : "for (const key of Object.keys(SPRITE_MASKS)) delete SPRITE_MASKS[key]; spriteFrames.clear();})();",
          ),
      context,
      { filename: file },
    );
  await Promise.all(pending);
  const game = window.__CQ__;
  game.state.settings.sound = false;
  return { game, canvas, context, storage, elements, window };
}
