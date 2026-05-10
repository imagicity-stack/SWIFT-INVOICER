import cors from 'cors';
import express from 'express';
import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import type { AppState } from './types';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const getCredential = () => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccount) {
    return applicationDefault();
  }

  return cert(JSON.parse(serviceAccount));
};

if (!getApps().length) {
  initializeApp({
    credential: getCredential(),
  });
}

const db = getFirestore();
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS.'));
    },
  })
);

const getWorkspaceId = (request: express.Request) => {
  const workspaceId = request.header('x-swift-workspace-id');

  if (!workspaceId || !/^[a-zA-Z0-9_-]{8,128}$/.test(workspaceId)) {
    return null;
  }

  return workspaceId;
};

const isValidState = (state: unknown): state is AppState => {
  if (!state || typeof state !== 'object') return false;

  const candidate = state as AppState;
  return Boolean(
    candidate.settings &&
      typeof candidate.settings.name === 'string' &&
      typeof candidate.templateId === 'string' &&
      Array.isArray(candidate.invoices)
  );
};

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'swift-invoicer-api' });
});

app.get('/api/state', async (request, response) => {
  const workspaceId = getWorkspaceId(request);

  if (!workspaceId) {
    response.status(400).json({ error: 'Missing or invalid workspace id.' });
    return;
  }

  const snapshot = await db.collection('workspaces').doc(workspaceId).get();
  response.json({ state: snapshot.exists ? snapshot.data()?.state ?? null : null });
});

app.put('/api/state', async (request, response) => {
  const workspaceId = getWorkspaceId(request);

  if (!workspaceId) {
    response.status(400).json({ error: 'Missing or invalid workspace id.' });
    return;
  }

  const { state } = request.body as { state?: unknown };

  if (!isValidState(state)) {
    response.status(400).json({ error: 'Invalid application state payload.' });
    return;
  }

  await db.collection('workspaces').doc(workspaceId).set(
    {
      state,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  response.json({ ok: true });
});

export const api = onRequest(
  {
    region: process.env.FUNCTION_REGION || 'us-central1',
  },
  app
);
