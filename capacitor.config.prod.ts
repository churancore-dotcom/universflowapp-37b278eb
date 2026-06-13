import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Capacitor config used for APK builds in GitHub Actions
 * (.github/workflows/build-android.yml copies this over capacitor.config.ts
 * before `npx cap add android`).
 *
 * The dev config has a `server.url` pointing to the Lovable sandbox so phones
 * can hot-reload. That MUST NOT ship in the APK — otherwise the app needs
 * internet to load its own HTML and shows a black screen offline / on flaky
 * networks. This file deliberately omits `server.url`.
 *
 * Keep `appId` in sync with:
 *   - android-config/google-services.json (package_name)
 *   - the PKG variable in build-android.yml (MainActivity path)
 * Changing this without updating both will break the Android build.
 */
const config: CapacitorConfig = {
  appId: 'app.lovable.id5acaae55bbc847a7bd32f3924d8ef986',
  appName: 'Univers Flow',
  webDir: 'dist',
  // No server.url → assets are served from the APK's local file:// bundle
  // through Capacitor's https://localhost scheme.
  server: {
    androidScheme: 'https',
    // Allow http subresources so legacy CDN covers don't break the WebView.
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      // Short native splash → React's own SplashScreen component takes over.
      // If this is too long and React crashes, the user sees endless black.
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#FF2D55',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    // Set explicitly so the WebView never falls back to a transparent surface
    // (a transparent WebView over a black activity = "black screen" reports).
    backgroundColor: '#000000',
    allowMixedContent: true,
    // captureInput must be FALSE — true breaks IME composition (emoji
    // keyboard, swipe typing, autocomplete/autosuggest) inside the WebView.
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
  // Stops JS from hijacking the hardware back button during media playback.
  // @ts-expect-error supported by the Android runtime even if absent from older type defs
  hardwareBackButton: false,
};

export default config;
