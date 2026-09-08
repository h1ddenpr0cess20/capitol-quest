# Capitol Quest

A work-in-progress joke project: a browser RPG with a fictional story, a party drawn from the Trump administration, and the original pixel-art sprite set. Current build: **v6.0.1**.

I made this for fun after the administration's recent game-related posts. I might work on it more later, or I might not. There's no release schedule or promise that this becomes a finished game. Expect bugs, rough edges, and unfinished polish.

## What inspired it

On September 3, 2026, the White House launched its [Arcade page](https://www.whitehouse.gov/arcade/). Its social accounts announced the launch with animations referencing Xbox, PlayStation, Nintendo, and Sega startup screens, according to [Associated Press coverage](https://abcnews.com/Technology/wireStory/white-house-website-debuts-5-retro-arcade-video-136188912). Those game-themed posts were the jumping-off point for this project.

Capitol Quest is an independent fictional joke game, with no affiliation with the administration or the game companies referenced in those posts.

## Play

1. Download this repository using **Code → Download ZIP**, then extract it.
2. Open **[PLAY_CAPITOL_QUEST_v6.html](PLAY_CAPITOL_QUEST_v6.html)** in a desktop browser.

The standalone HTML contains the game, artwork, and fonts. No installation, server, account, or internet connection is needed. GitHub's file viewer displays source; download the file to play it.

You can also open [capitol_quest_game/index.html](capitol_quest_game/index.html), keeping its scripts and `assets` folder together.

## What's in this build

- Twelve connected districts, a main story, six side missions, and repeatable challenges.
- Turn-based battles, character-specific actions, leveling, skill unlocks, and talents.
- Manual, Balanced, Aggressive, and Conserve battle modes, with speed controls.
- Click-to-walk, keyboard movement, an atlas, local maps, and fast travel.
- Browser saves and save-file import/export.

These are implemented features, not a claim that the game is finished or fully tested.

## Controls

| Action | Input |
| --- | --- |
| Move | WASD / arrow keys, or click the ground |
| Sprint | Shift |
| Interact / confirm | E / Enter |
| District atlas | M; Tab switches map views |
| Progression | P |
| Supplies / journal | I / Q |
| Auto-battle options / cycle mode in combat | B |
| Battle speed | V |
| Back / pause | Esc |
| Save | F5 |

See [the game guide](capitol_quest_game/README.txt) for combat, progression, and save details. Saves use browser storage; use **Export save** before moving files or changing browsers.

## Original sprites and source

The full original **1536 × 1024 sprite sheet** is included at [capitol_quest_game/assets/atlas.png](capitol_quest_game/assets/atlas.png). It is byte-for-byte identical to the atlas in the supplied v5 package. The extracted actor, prop, landmark, and effect sheets are included in the same [assets folder](capitol_quest_game/assets).

The earlier project notes record a lossless PNG re-encoding of the original atlas and an AI-assisted cleanup of the battle background. The full sprite sheet, original battle reference, and cleaned backdrop are retained separately. See [asset provenance](capitol_quest_game/ASSET_NOTES.txt) and the [font license](capitol_quest_game/assets/FONT_LICENSE.txt).

Editable source lives in `capitol_quest_game/`. To rebuild the standalone HTML with Python 3:

```sh
python3 capitol_quest_game/build_standalone.py
```

This writes `PLAY_CAPITOL_QUEST_v6.html` at the repository root. No third-party Python packages are required.

## Current status

**v6.0.1 fixes the blank-map crash** caused by two canvas ellipse calls missing a required argument. Rendering checks covered all twelve districts, the map screens, an auto-battle, and save/reload. Live browser testing was blocked in the build environment; browser, audio, fullscreen, and mobile behavior still need real-world testing. The [QA report](capitol_quest_game/QA_REPORT.txt) records the checks and their limits.

Further work may happen whenever I feel like returning to it. It may also stay here as a snapshot of the joke.
