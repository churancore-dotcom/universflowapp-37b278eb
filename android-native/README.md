# Native Android sources injected at build time

These Java files are copied into `android/app/src/main/java/<pkg>/media/` by
`.github/workflows/build-android.yml` (which also patches `MainActivity.java`,
`AndroidManifest.xml`, and adds the required permissions + Gradle deps).

## Files

- `MediaNotificationPlugin.java` — Capacitor plugin (JS bridge) for the
  lock-screen / notification controls used by `src/lib/nativeMusicControls.ts`.
- `MediaNotificationService.java` — Foreground service + MediaSessionCompat
  + MediaStyle notification. Does NOT play audio.
- `NativeAudioPlayerPlugin.java` — Capacitor plugin (JS bridge) for the
  ExoPlayer foreground service.
- `NativeAudioPlayerService.java` — Foreground service hosting **ExoPlayer**
  (Media3 1.4.1). This is the audible audio source on Android. It owns
  audio focus, a tuned `DefaultLoadControl` (50s/100s buffer), a stall
  watchdog, and its own `MediaSessionCompat` so the OS treats the app as
  legitimate ongoing media playback. Decoupled from the Activity / WebView
  lifecycle — keeps playing smoothly when the app is backgrounded or the
  screen is locked.

## JS side

- `src/lib/nativeAudioPlayer.ts` — typed wrapper around `NativeAudioPlayer`.
- `src/lib/nativePlaybackMirror.ts` — mirrors the WebView's HTMLAudioElement
  control (play/pause/seek/volume + src changes) onto the native ExoPlayer.
  On Android the HTMLAudio is **muted** and ExoPlayer is the audible source.
  On web/iOS this is a no-op.
- `src/lib/nativeMusicControls.ts` — talks to `MediaNotificationPlugin` for
  the older lock-screen notification (still active for compat).

## Gradle dependencies added by CI

```
implementation 'androidx.media:media:1.7.0'
implementation 'androidx.media3:media3-exoplayer:1.4.1'
implementation 'androidx.media3:media3-session:1.4.1'
implementation 'androidx.media3:media3-ui:1.4.1'
implementation 'androidx.media3:media3-datasource-okhttp:1.4.1'
```

## Known phase-1 limitation

Because both HTMLAudio (muted, for UI events) and ExoPlayer (audible) stream
the same URL, bandwidth roughly doubles on Android. Phase-2 will switch
PlayerContext to drive progress/ended directly from ExoPlayer events and
stop the HTMLAudio fetch.

Premium DSP effects (EQ, Reverb, Headphone 3D Surround, Smart Crossfade Pro,
Gapless Pro) remain Web-Audio-only and are inaudible on Android in phase 1
because the HTMLAudio is muted. They can be reimplemented natively via
ExoPlayer `AudioProcessor`s in a follow-up.
