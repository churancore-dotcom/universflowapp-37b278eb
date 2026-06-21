# Native Android sources injected at build time

These Java files are copied into `android/app/src/main/java/<pkg>/media/` and
`android/app/src/main/java/<pkg>/island/` by `.github/workflows/build-android.yml`
(which also patches `MainActivity.java`, `AndroidManifest.xml`, and permissions).

- `MediaNotificationPlugin.java` — Capacitor plugin (JS bridge)
- `MediaNotificationService.java` — Foreground service + MediaSessionCompat + MediaStyle notification
- `DynamicIslandPlugin.java` — Capacitor plugin for Android overlay permission + controls
- `DynamicIslandService.java` — system-wide floating pill overlay

JS side: `src/lib/nativeMusicControls.ts` calls `MediaNotification`; `src/lib/dynamicIsland.ts` calls `DynamicIsland`.
