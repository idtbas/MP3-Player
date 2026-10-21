# MP-1 — portable audio player

A web page that is a music player: an imaginary handheld in the Teenage
Engineering design language, built for iPhone Safari (iPhone 17 Pro, portrait,
add-to-home-screen).

`index.html` is the whole app. It has no build step, no dependencies, no CDN
and no web fonts. `sw.js` is an optional 1 KB helper that caches the page so
the home-screen app also opens offline.

## Use

1. Open the page, tap the device to power it on (iOS only allows sound after a tap).
2. **02 ADD** opens the iOS file picker; songs are stored in IndexedDB.
3. **09 ENC**: drag in a circle to turn, push for OK, hold to switch
   VOL / SEEK / SCRL. In lists it scrolls; hold on a song for PLAY / MOVE / REMOVE.
4. **01 MENU** opens the menu (library, settings, info) and goes back.
5. **HOLD** locks every control, **SND** mutes the UI sounds.

## Host

Any static host works. With GitHub Pages: Settings → Pages → deploy from the
branch that holds `index.html` and `sw.js`. Then in Safari: Share → Add to Home Screen.

## iOS notes

- iOS ignores `audio.volume`. The default output (**DSP**) runs the music
  through Web Audio so the encoder controls volume and the visualiser reads the
  real signal. **DIRECT** output plays the element straight to the system
  (side-key volume) and is the most robust path with the screen locked. If iOS
  silences Web Audio in the background, the player switches to DIRECT by itself.
- Wireless: Safari cannot identify AirPods. The AIR key opens the system
  AirPlay picker, and the LED shows what WebKit reports
  (`webkitCurrentPlaybackTargetIsWireless`), which is true for AirPlay routes.
- Haptics use the iOS 18 `<input type="checkbox" switch>` trick and are silent
  where unsupported.
