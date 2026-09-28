import { createSession, listMessages, listSessions, sendMessage } from './client';

const TOKEN = 'test-token';

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

describe('api/client', () => {
  const originalEnv = import.meta.env.VITE_AI_API_URL;

  beforeEach(() => {
    import.meta.env.VITE_AI_API_URL = 'https://dev-ai.example.workers.dev';
  });

  afterEach(() => {
    import.meta.env.VITE_AI_API_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it('throws a clear error when VITE_AI_API_URL is not configured', async () => {
    import.meta.env.VITE_AI_API_URL = '';

    await expect(listSessions(TOKEN)).rejects.toThrow('VITE_AI_API_URL is not configured');
  });

  it('lists sessions, unwrapping the { data } envelope', async () => {
    mockFetchOnce(200, { object: 'list', data: [{ id: 's1', title: 'Hi' }], next_cursor: null });

    const sessions = await listSessions(TOKEN);

    expect(sessions).toEqual([{ id: 's1', title: 'Hi' }]);
    expect(fetch).toHaveBeenCalledWith(
      'https://dev-ai.example.workers.dev/v1/sessions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('creates a session via POST', async () => {
    mockFetchOnce(201, { id: 's1', title: null, agent_id: null, team_id: null, created_at: 'now' });

    const session = await createSession(TOKEN);

    expect(session.id).toBe('s1');
    expect(fetch).toHaveBeenCalledWith(
      'https://dev-ai.example.workers.dev/v1/sessions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lists messages for a session', async () => {
    mockFetchOnce(200, {
      object: 'list',
      data: [
        {
          id: 'm1',
          session_id: 's1',
          role: 'user',
          content: 'hi',
          agent_id: null,
          created_at: 'now',
        },
      ],
      next_cursor: null,
    });

    const messages = await listMessages(TOKEN, 's1');

    expect(messages).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://dev-ai.example.workers.dev/v1/sessions/s1/messages',
      expect.anything(),
    );
  });

  it('sends a message and returns the assistant reply', async () => {
    mockFetchOnce(200, { session_id: 's1', message: { role: 'assistant', content: 'hello' } });

    const result = await sendMessage(TOKEN, 's1', 'hi');

    expect(result.message.content).toBe('hello');
  });

  it("surfaces the ai worker's nested { error: { message } } shape", async () => {
    mockFetchOnce(403, {
      error: { message: 'Missing required permission: ai:chat', type: 'invalid_request_error' },
    });

    await expect(listSessions(TOKEN)).rejects.toThrow('Missing required permission: ai:chat');
  });
});
