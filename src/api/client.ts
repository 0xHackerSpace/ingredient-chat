import type { ChatApiMessage, ChatSession, ListResponse, SendMessageResponse } from './types';

// Host, never hardcoded — the ai worker is a separate deployment from the
// auth/api workers the host itself talks to. Chat makes its own calls; the
// host only ever hands it a token (see ../Chat/index.tsx).
function requireApiUrl(): string {
  const value = import.meta.env.VITE_AI_API_URL;
  if (!value) throw new Error('VITE_AI_API_URL is not configured');
  return value;
}

async function parseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // wrapper-api's ai worker returns OpenAI-style nested errors,
    // { error: { message, type } } — not the flat { error: "..." } shape
    // the auth/api workers use.
    const message =
      typeof body?.error?.message === 'string'
        ? body.error.message
        : typeof body?.error === 'string'
          ? body.error
          : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function listSessions(token: string): Promise<ChatSession[]> {
  const response = await fetch(`${requireApiUrl()}/v1/sessions`, { headers: authHeaders(token) });
  const { data } = await parseJson<ListResponse<ChatSession>>(response);
  return data;
}

export async function createSession(token: string): Promise<ChatSession> {
  const response = await fetch(`${requireApiUrl()}/v1/sessions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
  return parseJson<ChatSession>(response);
}

export async function listMessages(token: string, sessionId: string): Promise<ChatApiMessage[]> {
  const response = await fetch(`${requireApiUrl()}/v1/sessions/${sessionId}/messages`, {
    headers: authHeaders(token),
  });
  const { data } = await parseJson<ListResponse<ChatApiMessage>>(response);
  return data;
}

export async function sendMessage(
  token: string,
  sessionId: string,
  content: string,
): Promise<SendMessageResponse> {
  const response = await fetch(`${requireApiUrl()}/v1/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content }),
  });
  return parseJson<SendMessageResponse>(response);
}
