# Dedicated App

This folder contains the standalone mobile-focused app built with Next.js and prepared for Capacitor wrapping.

## Stack

- Next.js
- Capacitor

## Prerequisites

- Node.js LTS
- pnpm
- Android Studio
- Android SDK Platform Tools
- Java 17 or newer

## First-Time Setup

Run this once when the dedicated app folder is set up for the first time:

```bash
pnpm install
pnpm cap:init
pnpm cap:add:android
```

## Daily APK Flow

Use this sequence after updating code or `.env`:

```bash
pnpm build
pnpm cap:sync
pnpm cap:open:android
```

## Google Play AAB

Google Play does not accept bundles signed with Android's debug certificate.
Use a private upload keystore and keep it outside the repository:

```powershell
keytool -genkeypair -v -keystore messzen-upload.jks -alias messzen-upload -keyalg RSA -keysize 2048 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path .\messzen-upload.jks))) | Set-Clipboard
```

Store that Base64 value in the GitHub repository secret
`ANDROID_KEYSTORE_BASE64`, and set `ANDROID_KEY_ALIAS`,
`ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_PASSWORD` from the values used
when creating the key. Never use `%USERPROFILE%\.android\debug.keystore` or
the alias `androiddebugkey`. Keep a secure backup of the upload keystore and
passwords; future updates must use the same upload identity.

Run the **Build Android APK or Play Bundle** workflow with
`play-apk-and-aab`, then upload its `Messzen-play-<run number>.aab` artifact.
The workflow and Gradle build both reject debug signing for release builds.

## Recommended Workflow

1. Update the app code.
2. Set `NEXT_PUBLIC_API_URL` in `.env`.
3. Run `pnpm build`.
4. Run `pnpm cap:sync`.
5. Open Android Studio with `pnpm cap:open:android`.

## Notes

- The app uses the same backend as the main dashboard.
- Form fields are aligned with backend DTOs in `backend/src/app/module/*/dto`.
- The code is organized with reusable components so future member, expense, payment, complaint, deposit, and bill updates stay easy to manage.
- Use the Play workflow above for signed release artifacts; use Android Studio's
  debug build only for local development.
