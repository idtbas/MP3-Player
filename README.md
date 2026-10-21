# MP-1 — portable audio player

A web page that is a music player: an imaginary handheld in a strict,
manual-like industrial design language, built for iPhone Safari (iPhone 17 Pro,
portrait, add to home screen).

`index.html` is the whole app: no build step, no dependencies, no CDN, no web
fonts. Next to it: `sw.js` (offline shell), `manifest.webmanifest` and `icons/`.

## Controls

The keys are numbered like a manual. Every key has a second function printed
under it, reached with **01 SHIFT** (OP-1 style).

| # | Key | Press | SHIFT + press |
|---|-----|-------|---------------|
| 01 | SHIFT | hold = momentary, tap = one shot, tap twice = lock | — |
| 02 | MENU | menu / back (hold: home) | setup |
| 03 | ADD | add songs (iOS file picker) | favourite |
| 04 | AIR | AirPlay picker | sleep timer |
| 05 | SHUF | shuffle | visualiser (spectrum / scope) |
| 06 | RPT | repeat off / all / one | FX: 3-band EQ, tape, crossfade, speed |
| 07 | PREV | previous (hold: scan back) | recent |
| 08 | PLAY | play / pause | stop |
| 09 | NEXT | next (hold: scan forward) | queue |
| 10 | ENC | turn: VOL / SEEK / SCRL or scroll lists · push: OK · hold: mode / song options | turn: speed (pitch kept) · push: find |

Slide switches: **HOLD** locks every control, **SND** mutes the UI sounds.
Holding SHIFT shows the map of second functions on the display.

Hardware keyboard (iPad keyboards, Full Keyboard Access): **1–9** are keys 01–09
(SHIFT + digit works on any layout), arrows turn the encoder, Return pushes it,
Space plays, Esc goes back, **H** toggles HOLD.

## Functions

- Library: tracks, artists, albums, favourites, recently played, up-next queue.
- Search: type with the encoder (A–Z, 0–9), 07 deletes, 09 jumps to results.
- Sleep timer (15–90 min or end of song) with a 12 s fade.
- 3-band EQ (±12 dB), one tape / lo-fi effect (saturation, wow & flutter, hiss,
  roll-off), output limiter.
- Playback speed 0.5×–2× with pitch preserved.
- Crossfade 0 / 2 / 4 / 8 s with equal-power curves; gapless hand-over at 0.
- Backup / restore of library metadata (favourites, play counts, order, queue,
  recent, settings) as JSON; audio stays on the phone.
- Three display technologies (white OLED, amber LCD, grey e-ink) and three
  anodised editions (orange, mint, graphite).

## Accessibility

- VoiceOver: every key and switch has a label that follows SHIFT (e.g. 03 reads
  "Favourite" while SHIFT is active). Double-tap presses a key. The encoder is an
  adjustable element: swipe up / down turns it one detent and reads what it
  changed. Separate buttons push and hold it. The display is mirrored into a
  live region (menus, songs, overlays).
- Reduce Motion: keys and switches stop bouncing, the encoder does not coast,
  screens change without the dither dissolve, blinking becomes steady.
- Nothing stays pressed: a finger sliding off a key cancels it, and calls, app
  switches, rotation and lost touches release every key and stop scanning.

## Data

Songs live in IndexedDB (`mp1-library`, schema v2, append-only migrations);
settings in `localStorage`. The app asks for persistent storage, warns when the
quota runs low and refuses imports that would not fit.

## Host

Any static host. With GitHub Pages: deploy the branch holding `index.html`,
`sw.js`, `manifest.webmanifest` and `icons/`. In Safari: Share → Add to Home Screen.
The service worker is versioned by the app version and only caches the shell.

## iOS limits (honest)

- iOS ignores `audio.volume`. **DSP** output (default) routes music through Web
  Audio so the encoder, EQ, tape, crossfade and visualiser work. **DIRECT** plays
  the element straight to the system (side-key volume) and is the most robust
  path with the screen locked. If iOS silences Web Audio in the background, the
  player switches to DIRECT by itself; EQ / tape / crossfade need DSP.
- Safari cannot identify AirPods or Bluetooth devices. AIR opens the system
  AirPlay picker; the LED shows what WebKit reports for AirPlay routes.
- Haptics use the iOS 18 `<input switch>` trick: one fixed tick, no intensity
  control, silent where unsupported.
- Background playback depends on iOS: long pauses in the background can end the
  audio session; Media Session (lock screen) controls are what iOS provides.
- Storage is the browser's: iOS may evict data of web apps not used for weeks
  unless persistent storage is granted (it usually is for home-screen apps).
- Portrait only is enforced by the page (a rotate card), not by iOS.

## Changelog

**2.0.0**
- Body: symmetric 6-column grid, one top-left light source, anodised grain,
  chamfered bevels, textured rubber keys, layered shadows, specular knob and glass.
- Silkscreen: numbered controls 01–10, connector lines, icons, engraved model and serial.
- New SHIFT key with a second function on every key; shift map on the display.
- Display: three technologies with pixel dissolve / e-ink flash transitions,
  sharper 5×7 and 3×5 fonts (now with Ä Ö Ü), dithered covers, waveform
  scrubber, spectrum and auto-ranging scope.
- Designed states: standby, boot, empty, loading, error, low storage, hold, import.
- Library views, encoder search, queue, favourites, recent, sleep timer, EQ, tape,
  speed, crossfade / gapless, backup / restore, grouped settings.
- Two-deck audio engine, limiter, Media Session, `audioSession` "playback".
- Offline PWA: real manifest and icons, versioned service worker.
- VoiceOver labels and actions, keyboard shortcuts, Reduce Motion, safe areas,
  rotate card, release-all on interruption, drag-off cancel.

**1.0.0** — first device: display, keys, encoder, library, DSP / direct output.
