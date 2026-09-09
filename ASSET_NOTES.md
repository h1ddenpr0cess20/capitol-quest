# Asset notes

- `assets/atlas.png` is the original 1536 × 1024 sprite sheet retained from the supplied game assets. Its bytes match the supplied build. Earlier preparation losslessly re-encoded the PNG for decoder compatibility; the documented source pixels were preserved.
- Actor, prop, landmark, item, portrait, and effect artwork comes from that sheet. Extracted sheets, frame manifests, foot anchors, and draw-time facing rules support the game's rendering.
- `assets/battle_reference.png` retains the original battle-screen reference. `assets/battle_backdrop.png` is an AI-assisted cleanup of that reference with characters and interface elements removed.
- District scenery combines Canvas drawing with the supplied sprites and tiles.
- Fonts are DejaVu Sans Mono. The original license is in `assets/FONT_LICENSE.txt`.
- Music and sound effects are synthesized locally with WebAudio.

## Transparency cleanup

The original PNG artwork is preserved. `scripts/build-sprite-masks.mjs` generates frame-specific background-removal metadata in `assets/sprite_masks.json`. The renderer caches each source crop once and clears only those pixel runs. Both district scenery and character/effect rendering use the same cache.

All 125 frames were reviewed: 54 character frames (walking, actions, enemies and NPCs), 11 props, 5 landmarks, and 55 items/effects. Cleanup includes character outline fringes; filled gaps around the protester's sign, farmer's pitchfork and senior's walker; action-pose scraps; furniture mattes; scenery around the fountain and monument; tree fringes; effect mattes and neighboring crop fragments. Frames with no visible background remnants remain unchanged.

Character masks live in `scripts/actor-masks.mjs`. A single exterior pass removes neutral fringe pixels against darker outlines; reviewed regions handle enclosed background islands. The tree's shaded canopy, pale prop interiors, and retained character artwork are protected. No frame rectangles, foot anchors, facing rules or retained pixel colors change.

Masks are bundled into the game. Applying them requires neither pixel readback nor additional network requests, retaining local-file support. To adjust a mask, edit the generator and run `npm run build` and `npm test`. Run `npm run review:sprites` to render every frame before/after on contrasting backgrounds in `.tmp/review/`. Its inventory includes unchanged frames so an entire category cannot silently disappear from review. Check these pages after changing color thresholds; pixel invariants alone cannot judge a silhouette.
