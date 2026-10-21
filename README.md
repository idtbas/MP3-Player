# MP-1 — portable audio player

A web page that is a music player: an imaginary handheld in a strict,
manual-like industrial design language, built for iPhone Safari (iPhone 17 Pro,
portrait, add to home screen).

`index.html` is the whole app: no build step, no dependencies, no CDN, no web
fonts. Next to it: `sw.js` (offline shell), `manifest.webmanifest` and `icons/`.

## Controls

The keys are numbered like a manual. Every key has a second function printed
under it, reached with **01 SHIFT** (OP-1 style). Keys 03–06 also have a third,
printed in orange: **hold the key and turn 10** to play the song like an
instrument; **hold the key and push 10** sets that control back to neutral.

| # | Key | Press | SHIFT + press | Hold + turn 10 |
|---|-----|-------|---------------|----------------|
| 01 | SHIFT | hold = momentary, tap = one shot, tap twice = lock | — | — |
| 02 | MENU | menu / back (hold: home) | setup | — |
| 03 | ADD | add songs (iOS file picker) | favourite | SPACE: reverb 0–10 |
| 04 | AIR | AirPlay picker | sleep timer | FILTER: low-pass ← → high-pass |
| 05 | SHUF | shuffle | DECK page | PITCH: ±12 semitones |
| 06 | RPT | repeat off / all / one (in a loop: leave it) | FX: EQ, tape, crossfade, speed | LOOP: ¼ – 32 beats |
| 07 | PREV | previous (hold: scan back) | recent | — |
| 08 | PLAY | play / pause | stop | — |
| 09 | NEXT | next (hold: scan forward) | queue | — |
| 10 | ENC | turn: VOL / SEEK / SCRL or scroll lists · push: OK · hold: mode / song options | turn: speed · push: find | — |

Holding 03–06 without turning shows the control and its current value.

Slide switches: **HOLD** locks every control, **SND** mutes the UI sounds.
Holding SHIFT shows the map of second functions on the display.

Hardware keyboard (iPad keyboards, Full Keyboard Access): **1–9** are keys 01–09
(SHIFT + digit works on any layout), arrows turn the encoder, Return pushes it,
Space plays, Esc goes back, **H** toggles HOLD.

## Deck: the song as an instrument

- **Pitch** ±12 semitones at any speed. An AudioWorklet shifter splices its read
  head where a cross-correlation says the waveform continues, so tones stay
  exactly on pitch (measured: a 440 Hz tone lands on 220 / 330 / 370 / 415 /
  659 / 880 Hz for −12 / −5 / −3 / −1 / +7 / +12).
- **Speed** 0.5×–2× (SHIFT + turn) in **key lock** (pitch kept) or **tape**
  (pitch follows, like a turntable). LOCK / TAPE on the DECK page or in settings.
- **Filter**: one knob, low-pass to the left, high-pass to the right, resonant.
- **Space**: a plate-like reverb (2.4 s), dry/wet on one knob.
- **Beat loops** of ¼, ½, 1, 2, 4, 8, 16 or 32 beats. The tempo of every song is
  detected (onset curve, autocorrelation, comb refinement), the loop snaps to
  the beat just before you turned, and loops are sample-accurate: from the first
  loop on, the song plays from its decoded buffer. The switch from the
  `<audio>` element is aligned on the sound (cross-correlation; in Chromium it
  lands within 1 ms) or, where a player feeds Web Audio unevenly, made exactly
  at the loop's end. While looping, the scrubber zooms onto the loop.
- **Presets**: SLOWED (0.8× tape + space), NIGHTCORE (1.25× tape), FLAT.
- **Render**: writes the deck's sound (speed, pitch, filter, space) into a new
  song: a WAV with the original's cover, placed right after it in the library.
  The deck then goes back to flat, so the edit plays as it was heard. EQ and
  tape FX stay out of the render; they colour whatever plays.
- **Share file** (song menu): any song, edits included, through the iOS share
  sheet (Save to Files, AirDrop, …).

## Functions

- Library: tracks, artists, albums, favourites, recently played, up-next queue.
- Search: type with the encoder (A–Z, 0–9), 07 deletes, 09 jumps to results.
- Sleep timer (15–90 min or end of song) with a 12 s fade.
- 3-band EQ (±12 dB), one tape / lo-fi effect (saturation, wow & flutter, hiss,
  roll-off), output limiter.
- Playback speed 0.5×–2× with pitch preserved or following (see the deck).
- Tempo (BPM) shown on the now-playing screen and in the song info.
- Crossfade 0 / 2 / 4 / 8 s with equal-power curves; gapless hand-over at 0.
- Backup / restore of library metadata (favourites, play counts, order, queue,
  recent, settings) as JSON; audio stays on the phone.
- Three display technologies (white OLED, amber LCD, grey e-ink) and three
  anodised editions (orange, mint, graphite).
- Self test (SETTINGS → SYSTEM → SELF TEST): a lamp test with motion drives
  every dot for 2.4 s and measures the real frame rate on this phone, then
  lists what iOS granted: audio engine and session, lock-screen keys, haptics,
  offline readiness, persistent storage. PASS needs ≥ 55 fps with at most 3 %
  late frames.

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
The service worker is versioned by the app version and only caches the shell;
the page itself is fetched from the network first, so updates arrive on the next launch.

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
- The deck (pitch, filter, space, loops) and render work on the DSP output only.
  The first loop on a song decodes it fully (about 100 MB of memory for four
  minutes) and engages after a second or two; later loops on that song are
  instant.
- Renders are uncompressed WAV (about 10 MB per minute); Safari has no
  built-in encoder for compressed audio.

## Performance

The display is driven like a real panel: it is only redrawn when a dot, the
theme, the brightness or the power state changes, and then only the rows that
changed. Static screens cost nothing per frame; playback redraws the spectrum
and the scrolling title. Measured with the iPhone 17 Pro viewport at 3×
density: Chromium holds 60 fps with no late frames in the self test and during
music + spectrum + encoder spinning. The test container's WebKitGTK renders
in software without a GPU (a bare canvas page reaches 41 fps there); MP-1 runs
at 60 fps there at 1× density. iOS Safari composites canvases on the GPU; run
the self test on the phone for its number.

## Changelog

**2.1.1**
- The page is fetched network-first by the service worker: a new version
  arrives on the next launch instead of the second (offline still works).

**2.1.0** — a tool in your pocket
- Hold 03–06 and turn 10: SPACE, FILTER, PITCH, LOOP; hold and push resets.
  Printed on the body in orange; holding a key shows its control.
- Correlation-spliced AudioWorklet pitch shifter (native fallback).
- Key lock / tape speed modes; SLOWED, NIGHTCORE, FLAT presets.
- Tempo detection for every song; beat-snapped, sample-accurate loops with an
  aligned hand-over to a decoded buffer; zoomed loop lane on the scrubber.
- DECK page (SHIFT + 05): six faders and the preset / render buttons.
- RENDER to a new WAV song; SHARE FILE for any song.
- The encoder no longer coasts after a SHIFT or hold-key turn (a coasting
  turn used to land on the volume).

**2.0.1**
- Display redraws only on change, and only the changed rows (pixel-identical
  to a full redraw in all three themes).
- Self test with on-device frame-rate measurement.
- Turning the encoder under HOLD gives a dull blip and a haptic tick.
- Surface textures are seeded: the same unit on every launch.
- Lists stay inside their bounds if they shrink; VoiceOver reads group headers.

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
