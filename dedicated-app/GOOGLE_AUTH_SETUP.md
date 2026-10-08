# Google authentication setup

The app uses native Firebase Google Sign-In on Android, sends the Firebase ID
token to the backend, and receives the normal Messzen access token. Existing
users are linked by verified email. New users are created with the `MEMBER`
role.

## Firebase console

1. In Authentication > Sign-in method, enable Google and select a support email.
2. Keep the Android package name as `com.mess.management`.
3. Add SHA-1 and SHA-256 for every certificate that signs an installed build:
   - local debug certificate for a locally built debug APK;
   - stable test/upload certificate for CI release APKs;
   - Google Play app-signing certificate after Play App Signing is enabled.
4. Download `google-services.json` again after adding fingerprints and place it
   at `dedicated-app/android/app/google-services.json`.
5. Run `pnpm check:google-auth`. It must pass before enabling Google login.
   CI additionally checks that the JSON contains the exact SHA-1 used to sign
   the APK; a JSON generated for another certificate will not enable the button.

The current JSON is used at Android compile time. Changing only a runtime env
value cannot replace it.

## App environment

Set this while building the static app:

```env
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

Leave it `false` until the updated JSON passes `pnpm check:google-auth`. GitHub
Actions sets this automatically by inspecting the supplied JSON.

## Backend environment and database

The backend reuses `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY`.
If Google authentication must use a different service account, set:

```env
FIREBASE_AUTH_PROJECT_ID=
FIREBASE_AUTH_CLIENT_EMAIL=
FIREBASE_AUTH_PRIVATE_KEY=
```

Deploy the database migration before enabling the button:

```sh
npm run prisma:migrate
```

## Stable GitHub APK signing

Add these repository secrets so every test APK uses the same signing identity:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_SERVICES_JSON_BASE64` (recommended) or `GOOGLE_SERVICES_JSON`
- `PLAY_APP_SIGNING_CERT_SHA1` (required for `play-apk-and-aab`; copy the
  app-signing certificate SHA-1 from Play Console, not the upload SHA-1)

The workflow prints only the signing certificate SHA-1/SHA-256 in its summary.
Add those fingerprints in Firebase, download the refreshed JSON, update the
Firebase JSON secret, and rerun the build. The signed workflow also produces an
AAB for later Play Console upload.

Do not commit the keystore, passwords, service-account private key, or decoded
Firebase JSON.

## Moving to Google Play

Upload the generated signed AAB and enable Play App Signing. In Play Console,
copy the app-signing certificate SHA-1 and SHA-256 into the same Firebase
Android app, and store the SHA-1 in the `PLAY_APP_SIGNING_CERT_SHA1` GitHub
secret. Download `google-services.json` again, update its GitHub secret, and
rebuild. The Play workflow fails rather than publishing an AAB with Google
sign-in missing or signed by an unregistered certificate.
