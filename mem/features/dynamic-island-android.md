---
name: Dynamic Island (Android)
description: System-wide floating pill overlay shown over other apps when music plays in background. Native Android only (TYPE_APPLICATION_OVERLAY).
type: feature
---
Universflow Dynamic Island — a true system-wide overlay (Android only) that floats over other apps when music plays in background.

**Style:** Minimal Onyx — pure black pill, white text, pulsing rose (#FF2D55) dot. Tap = expand to mini card with prev / play-pause / next + slim rose progress bar + close (×). Long-press pill = open app.

**Native:**
- `android/app/src/main/java/com/universeflow/app/island/DynamicIslandPlugin.java` — Capacitor plugin (`DynamicIsland`).
- `android/app/src/main/java/com/universeflow/app/island/DynamicIslandService.java` — WindowManager overlay, fully programmatic (no XML/drawables).
- Mirrored to `android-native/java/` kit with `PACKAGE_PLACEHOLDER` for GitHub APK builds.
- Requires `SYSTEM_ALERT_WINDOW` permission (added to AndroidManifest).
- Registered in `MainActivity.kt`.

**JS bridge:** `src/lib/dynamicIsland.ts` — `canShowIsland`, `requestIslandPermission`, `showIsland`, `updateIsland`, `hideIsland`, `setIslandHandlers`.

**Wiring:** `src/contexts/PlayerContext.tsx` shows island whenever a song is loaded after overlay permission is granted. Permission settings opens once per session on first play; returning to the app retries display.

No-op on web and iOS.
