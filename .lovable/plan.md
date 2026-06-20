
# Native ExoPlayer Rewrite for Background-Stable Playback

## Goal

When the Android APK is backgrounded or the screen is locked, music must keep playing without stutter, exactly like Spotify / YT Music. Achieved by moving the actual player out of the WebView (Web Audio in JS) and into `MusicService` using ExoPlayer + MediaSessionCompat. The browser build is unchanged.

## Why this is required (root cause)

The current `MusicService.kt` is a foreground service shell. The real player is `src/services/AudioEngine.ts` running inside the WebView's `AudioContext`. When Android backgrounds the Activity, the WebView's JS thread, timers, and `AudioContext` are throttled by the OS — no wake lock, audio focus, or foreground service can prevent that, because Android does not recognise Web Audio inside a backgrounded WebView as legitimate media playback. The fix is to make Android play the audio natively while the WebView is just a controller.

## Scope

APK only. Browser build keeps Web Audio + EQ/Reverb/3D/Crossfade Pro effects untouched. On APK these premium DSP effects are disabled (Phase 1) and can be reimplemented later via ExoPlayer audio processors.

## Architecture

```text
                ┌─────────────────────────────────┐
                │  React / Capacitor WebView      │
                │  PlayerContext, useAudioPlayer  │
                └─────────────┬───────────────────┘
                              │ (Capacitor plugin calls)
                              ▼
                ┌─────────────────────────────────┐
                │  NativePlayerPlugin (Kotlin)    │
                │  load / play / pause / seek /   │
                │  setQueue / setVolume / state   │
                └─────────────┬───────────────────┘
                              │ (bound service)
                              ▼
                ┌─────────────────────────────────┐
                │  MusicService (foreground)      │
                │   • ExoPlayer                    │
                │   • DefaultLoadControl (tuned)   │
                │   • DefaultHttpDataSource +retry │
                │   • MediaSessionCompat           │
                │   • PlayerNotificationManager    │
                │   • AudioFocus (via ExoPlayer)   │
                └─────────────────────────────────┘
```

`PlayerContext` picks the engine at runtime:
- `Capacitor.isNativePlatform()` → NativePlayer plugin (ExoPlayer)
- otherwise → existing `AudioEngine` (Web Audio)

## Files to add

- `android/app/src/main/java/com/universeflow/app/NativePlayerPlugin.kt` — Capacitor plugin exposing `load`, `play`, `pause`, `seek`, `setQueue`, `next`, `previous`, `setVolume`, `getState`; emits `stateChange`, `positionChange`, `ended`, `error`, `nextRequested`, `previousRequested`.
- `src/services/NativePlayer.ts` — typed wrapper around the plugin, same shape as `AudioEngine` so `useAudioPlayer` can swap implementations.
- `src/services/playerEngine.ts` — small factory that returns `NativePlayer` on Capacitor, else `audioEngine`.

## Files to rewrite

- `android/app/src/main/java/com/universeflow/app/MusicService.kt` — host ExoPlayer:
  - `ExoPlayer.Builder(ctx)` with `DefaultLoadControl.Builder().setBufferDurationsMs(50_000, 100_000, 2_500, 5_000)` and `setPrioritizeTimeOverSizeThresholds(true)`.
  - `DefaultHttpDataSource.Factory().setConnectTimeoutMs(15_000).setReadTimeoutMs(15_000).setAllowCrossProtocolRedirects(true)` wrapped in `DefaultDataSource.Factory`.
  - `setHandleAudioBecomingNoisy(true)` and `setAudioAttributes(USAGE_MEDIA, CONTENT_TYPE_MUSIC, handleAudioFocus = true)` — ExoPlayer now owns audio focus, replacing the manual `AudioFocusRequest`.
  - `MediaSessionCompat` + `MediaSessionConnector` so the OS sees real `STATE_PLAYING`.
  - `PlayerNotificationManager` for the mediaStyle notification with play/pause/next/prev actions; `startForeground()` is called the instant `play()` is invoked.
  - `Player.Listener` → broadcasts `stateChange` / `positionChange` (250 ms ticker only while playing) / `ended` / `error` to the plugin.
  - Retry-on-stall: on `Player.STATE_BUFFERING` lasting >5 s, call `player.seekTo(player.currentPosition); player.prepare()`.
  - Service is `START_STICKY`, bound by the plugin; survives Activity destruction.
- `android/app/src/main/java/com/universeflow/app/MainActivity.kt` — register `NativePlayerPlugin`; remove the unconditional `startForegroundService(MusicService)` from `onCreate` (service is now started by the plugin on first `play()`, which is the correct Android 14 pattern).
- `android/app/src/main/java/com/universeflow/app/AudioFocusPlugin.kt` — becomes a no-op shim (kept for API compatibility) since ExoPlayer handles focus internally; remove the broadcast bridge so the WebView no longer pauses on focus changes when native is the active engine.

## Files to edit

- `android/app/build.gradle` — add `androidx.media3:media3-exoplayer:1.4.1`, `media3-session:1.4.1`, `media3-ui:1.4.1`, `media3-datasource-okhttp:1.4.1` (latest stable Media3).
- `android/app/src/main/AndroidManifest.xml` — already correct (`FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `mediaPlayback` service type). No change.
- `src/hooks/useAudioPlayer.ts` / `src/contexts/PlayerContext.tsx` — use `playerEngine` factory instead of importing `audioEngine` directly. State events come from the engine; on native the events are pushed from the plugin.
- `src/services/MediaSessionManager.ts` — skip on native (the OS notification is owned by `PlayerNotificationManager` now).
- `src/lib/streamProxy.ts` usage — on native, bypass the proxy and pass the original URL straight to ExoPlayer (CORS doesn't apply outside the WebView). Keep proxy for web.

## Behavior changes on APK (must call out to user)

- EQ, Reverb, Headphone 3D Surround, Smart Crossfade Pro, Gapless Pro — disabled on APK in this phase. Browser keeps them. They can be reimplemented later as ExoPlayer `AudioProcessor`s or via `ExoPlayer.setAudioSessionId` + system audio effects.
- Lock-screen karaoke lyrics keep working (driven by `positionChange` ticks from the plugin, identical contract).
- Notification is now the standard Media3 MediaStyle notification (with album art, prev/play/next), replacing the silent "Universe Flow is playing" placeholder.

## Buffer & retry tuning

- `DefaultLoadControl`: min 50 s, max 100 s, playback start 2.5 s, rebuffer 5 s. Generous to absorb mobile-network hiccups while backgrounded.
- HTTP: 15 s connect / read timeouts, cross-protocol redirects on (for CDN 301→https).
- Stall watchdog: if `STATE_BUFFERING` persists >5 s, re-`prepare()` once; on second stall, emit `error` and surface a toast via the plugin.

## Out of scope

- iOS native player (no `ios/` folder in repo).
- Re-implementing premium DSP effects on native — separate follow-up.
- Offline IndexedDB playback path (unchanged; already handled in JS and only used in foreground when picking a downloaded song — we can route those through ExoPlayer via a `blob:` URL in a follow-up if desired).

## Verification steps after the user pulls + `npx cap sync`

1. Start a song, lock the screen → audio continues, lock-screen notification shows transport controls.
2. Start a song, switch to another app → audio continues, no stutter.
3. Toggle airplane mode for 3 s mid-song → stall watchdog re-prepares, playback resumes when network returns.
4. Receive a phone call → ExoPlayer pauses (audio focus loss), resumes on call end (focus regain).
