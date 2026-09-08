# Testing notes

This is a work-in-progress snapshot, not a finished or fully browser-tested release.

The blank-map failure came from two `CanvasRenderingContext2D.ellipse` calls with a missing start-angle argument. Both now supply all seven required arguments. A regression check reproduced the original failure by enforcing browser Canvas argument counts, then passed after the correction.

Execution checks covered rendering in all twelve districts, the atlas and local maps, progression and automation menus, an auto-battle through victory, return to exploration, and save/reload. Screenshots in the README are game-canvas renders produced with Skia; they are not evidence of a live browser playthrough.

Live browser access was blocked in the build environment. Browser input, audio, fullscreen, file dialogs, and phone/touch behavior still need real-world testing.

Legacy internal save identifiers are retained for compatibility with earlier development builds. They are not public release numbers.
