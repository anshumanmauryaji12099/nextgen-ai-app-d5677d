# Android: install and APK builds

NEXTGEN AI is a Progressive Web App. There are three ways onto an Android phone,
from simplest to most involved.

## 1. Install the PWA (recommended)

1. Open the site in Chrome on Android.
2. Tap **Install app** (in the sidebar, Settings, or the landing page), or open
   Chrome's ⋮ menu → **Add to Home screen / Install app**.
3. NEXTGEN AI opens full-screen from its own icon, with a splash screen built
   from the manifest name, icon and background colour.

Updates arrive automatically: when a new deploy is detected the app shows
**“A new version is ready — Update now”**. Conversations are stored on the
device and are kept across updates.

## 2. Play Store package via Trusted Web Activity (no code changes)

Bubblewrap wraps the live PWA in a tiny Android app:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://nextgen-ai-app-d5677d.netlify.app/manifest.webmanifest
bubblewrap build        # produces app-release-signed.apk and .aab
```

Publish `public/.well-known/assetlinks.json` with the fingerprint Bubblewrap
prints so Chrome hides the URL bar.

## 3. Capacitor APK (native wrapper)

`capacitor.config.json` is already in the project. Because NEXTGEN AI renders
on the server, the Capacitor app loads the deployed site (`server.url`);
`android-shell/` is only a fallback page.

Requirements: Node 22+, Android Studio (with SDK 34+), JDK 17.

```bash
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android
npx cap add android            # creates ./android (commit it if you customise it)
npx cap sync android
npx cap open android           # Android Studio → Build → Build APK(s)
```

From the command line instead:

```bash
cd android && ./gradlew assembleDebug     # app/build/outputs/apk/debug/app-debug.apk
```

- Change `server.url` if you use a custom domain.
- App icons: replace the generated launcher icons with `public/icons/icon-512.png`
  using Android Studio → **New → Image Asset**.
- For voice input, add `<uses-permission android:name="android.permission.RECORD_AUDIO" />`
  to `android/app/src/main/AndroidManifest.xml`.
