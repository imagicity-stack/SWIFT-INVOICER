/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState } from '@/src/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const WORKSPACE_STORAGE_KEY = 'swift_workspace_id';

export const isFirebaseBackendConfigured = Boolean(API_BASE_URL);

const getWorkspaceId = () => {
  const existing = localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  localStorage.setItem(WORKSPACE_STORAGE_KEY, generated);
  return generated;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error('Firebase backend URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-swift-workspace-id': getWorkspaceId(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const loadRemoteState = async () => {
  const { state } = await request<{ state: AppState | null }>('/api/state');
  return state;
};

export const saveRemoteState = async (state: AppState) => {
  await request<{ ok: true }>('/api/state', {
    method: 'PUT',
    body: JSON.stringify({ state }),
  });
};
