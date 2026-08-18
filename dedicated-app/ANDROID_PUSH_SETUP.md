# Android Push Setup

The app uses native Firebase Cloud Messaging through Capacitor. It does not use browser Web Push for the Play Store build.

## Android project

1. Create or select the Firebase project for the Android application.
2. Register the Android app with package name `com.mess.management`.
3. Download `google-services.json` into `dedicated-app/android/app/google-services.json`.
4. Set `NEXT_PUBLIC_NATIVE_PUSH_ENABLED=true` when building locally.
5. Run `npm install` and `npx cap sync android` from `dedicated-app`.
6. Build and run the Android app once so the device can receive an FCM token.

For the GitHub Actions APK build, add one of these repository secrets:

- `GOOGLE_SERVICES_JSON`: the complete contents of `google-services.json`.
- `GOOGLE_SERVICES_JSON_BASE64`: the base64-encoded contents of that file.

If neither secret is present, the workflow deliberately builds an APK with
native push disabled so granting or denying notification permission cannot
crash the app. Push notifications require one of the secrets.

The Google services file is intentionally ignored by git.

## Backend environment

Configure these backend environment variables from a Firebase service account. Never commit the private key:

```env
FCM_PROJECT_ID=your-firebase-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
```

The service account needs permission to send Firebase Cloud Messaging messages. The backend registers device tokens through `/api/v1/notification/push/fcm/register` and sends FCM messages to the resolved user targets.

## Notification channels

The Android channel id is `messzen_notifications`. The app creates it on first authenticated launch and uses high importance with the default sound and vibration.
