# Asset notes

- `assets/atlas.png` is the original 1536 × 1024 sprite sheet retained from the supplied game assets. Its bytes match the supplied build. Earlier preparation losslessly re-encoded the PNG for decoder compatibility; the documented source pixels were preserved.
- Actor, prop, landmark, item, portrait, and effect artwork comes from that sheet. Extracted sheets, frame manifests, foot anchors, and draw-time facing rules support the game's rendering.
- `assets/battle_reference.png` retains the original battle-screen reference. `assets/battle_backdrop.png` is an AI-assisted cleanup of that reference with characters and interface elements removed.
- District scenery combines Canvas drawing with the supplied sprites and tiles.
- Fonts are DejaVu Sans Mono. The original license is in `assets/FONT_LICENSE.txt`.
- Music and sound effects are synthesized locally with WebAudio.

This repository preserves the current artwork; no sprites were regenerated for this snapshot.
