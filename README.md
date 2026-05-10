<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Swift Invoicer

Swift Invoicer is a Vite/React bulk invoice generator originally exported from Google AI Studio. The frontend is ready for Vercel, and persistent app state is wired to a Firebase Functions backend that uses the Firebase Admin SDK and Firestore.

## Architecture

- **Frontend:** Vite + React app deployed to Vercel.
- **Backend:** Firebase Functions HTTPS API in `functions/`.
- **Database:** Firestore, accessed only from the backend through the Firebase Admin SDK.
- **Credentials:** Admin credentials stay on Firebase/local server environments. They are never bundled into the Vercel frontend.

## Run locally

**Prerequisites:** Node.js 20+

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and configure:
   ```bash
   cp .env.example .env.local
   ```
3. Optional: point the frontend to a local/emulated Firebase Functions API:
   ```bash
   VITE_API_BASE_URL="http://127.0.0.1:5001/<project-id>/us-central1/api"
   ```
4. Run the frontend:
   ```bash
   npm run dev
   ```

## Firebase backend setup

1. Create/select a Firebase project and enable Firestore.
2. Copy `.firebaserc.example` to `.firebaserc`, then replace `your-firebase-project-id`.
3. Install backend dependencies:
   ```bash
   cd functions
   npm install
   ```
4. For Firebase Functions production, rely on the default service account. For local/custom server runs only, set `FIREBASE_SERVICE_ACCOUNT_KEY` to the full JSON service-account payload or use `GOOGLE_APPLICATION_CREDENTIALS`.
5. Configure CORS so only your Vercel and local frontend origins can call the API. Create `functions/.env.<project-id>` with:
   ```bash
   ALLOWED_ORIGINS="https://your-app.vercel.app,http://localhost:3000"
   ```
   You can also set `ALLOWED_ORIGINS` as a runtime environment variable in a trusted server environment.
6. Deploy the backend:
   ```bash
   cd functions
   npm run deploy
   ```

After deploy, Firebase prints an HTTPS function URL. Set that URL as `VITE_API_BASE_URL` in Vercel.

## Vercel deployment

Set these Vercel environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes for Firebase sync | Firebase Functions HTTPS URL, for example `https://api-abc123-uc.a.run.app`. |
| `GEMINI_API_KEY` | Only if you add Gemini calls | Kept from the AI Studio export; the current invoice parser does not call Gemini. |
| `APP_URL` | Optional | Your deployed Vercel URL. |

Do **not** put `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel. Admin SDK credentials belong only on Firebase Functions or trusted server environments.

## API endpoints

- `GET /health` — backend health check.
- `GET /api/state` — loads a workspace's app state from Firestore.
- `PUT /api/state` — saves a workspace's app state to Firestore.

The frontend sends an `x-swift-workspace-id` header generated per browser and stores a local copy as a fallback. For production user accounts, add Firebase Auth and validate ID tokens in the function before saving user-specific data.
