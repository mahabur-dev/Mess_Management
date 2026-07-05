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
- Java 17

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
- If you need a signed release APK later, generate it from Android Studio after sync.
