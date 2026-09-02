# Production Deployment

## Vercel

Vercel can build this project directly from GitHub:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

The Vite configuration must write the build output. Do not set `build.write` to `false` for a hosted deployment.

## Environment Variables

Copy the names from `.env.example` into Vercel. Configure Firebase client variables for browser authentication and Firestore. Configure `VITE_AUTH_API_URL` only if the OTP API is deployed separately. Keep `RESEND_API_KEY` and other server secrets in the server deployment environment only.

## Firebase Checklist

1. Create or select a Firebase project.
2. Enable the authentication providers used by the app.
3. Create a Firestore database.
4. Add the Vercel domain under Authentication authorized domains.
5. Write and test Firestore Security Rules for workspace membership and roles.
6. Confirm employee accounts cannot read or mutate unrelated workspaces.

## Launch Checklist

- Run `npm run build` locally.
- Test employer, admin, and employee accounts separately.
- Verify multiple assignees and creator history.
- Verify browser back/forward navigation.
- Verify mobile and desktop layouts.
- Confirm no `.env` files, API keys, passwords, or generated build artifacts are committed.
- Enable Vercel preview deployments and test before production promotion.
