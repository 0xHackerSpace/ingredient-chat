import type { ReactElement } from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { standaloneTheme } from '../standalone-theme';
import { createSession, listMessages, listSessions, sendMessage } from '../api/client';
import Item from './Item';

// Item's styled() components read theme.shell.* — rendering it without a
// theme carrying those tokens throws, the same way it would in a host that
// forgot to pass one. A ThemeProvider is required here, not optional.
const theme = createTheme(standaloneTheme);

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

vi.mock('../api/client', () => ({
  listSessions: vi.fn(),
  createSession: vi.fn(),
  listMessages: vi.fn(),
  sendMessage: vi.fn(),
}));

function makeToken(payload: Record<string, unknown>): string {
  const base64url = (value: string) =>
    btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));

  return `${header}.${body}.signature`;
}

describe('Item (no token)', () => {
  beforeEach(() => {
    vi.mocked(listSessions).mockReset();
  });

  it('renders nothing', () => {
    const { container } = renderWithTheme(<Item />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing even with a userProfile', () => {
    const { container } = renderWithTheme(
      <Item userProfile={{ role: 'operator', tenantName: 'Acme Plant 4' }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('never calls the API', () => {
    renderWithTheme(<Item />);

    expect(listSessions).not.toHaveBeenCalled();
  });
});

describe('Item (with a token — real wrapper-api sessions)', () => {
  // Carries ai:chat, so the permission gate never gets in the way of these
  // API-behavior tests — see the dedicated describe block below for that.
  const token = makeToken({ permissions: ['ai:chat'] });

  beforeEach(() => {
    vi.mocked(listSessions).mockReset();
    vi.mocked(createSession).mockReset();
    vi.mocked(listMessages).mockReset();
    vi.mocked(sendMessage).mockReset();
  });

  it("loads and shows the most recent session's messages", async () => {
    vi.mocked(listSessions).mockResolvedValue([
      { id: 's1', title: 'Boiler check', agent_id: null, team_id: null, created_at: 'now' },
    ]);
    vi.mocked(listMessages).mockResolvedValue([
      {
        id: 'm1',
        session_id: 's1',
        role: 'user',
        content: 'Ping',
        agent_id: null,
        created_at: 'now',
      },
    ]);

    renderWithTheme(<Item token={token} />);

    await waitFor(() => expect(screen.getByText('Ping')).toBeInTheDocument());
    expect(screen.getByText('Boiler check')).toBeInTheDocument();
  });

  it('shows an empty state, not a crash, when there are no sessions yet', async () => {
    vi.mocked(listSessions).mockResolvedValue([]);

    renderWithTheme(<Item token={token} />);

    await waitFor(() => expect(screen.getByText('No conversations yet')).toBeInTheDocument());
    expect(screen.queryByText('Hello, how can I help you?')).not.toBeInTheDocument();
  });

  it('creates a session lazily on the first message and shows the reply', async () => {
    vi.mocked(listSessions).mockResolvedValue([]);
    vi.mocked(createSession).mockResolvedValue({
      id: 's1',
      title: null,
      agent_id: null,
      team_id: null,
      created_at: 'now',
    });
    vi.mocked(sendMessage).mockResolvedValue({
      session_id: 's1',
      message: { role: 'assistant', content: 'Sure, on it.' },
    });

    renderWithTheme(<Item token={token} />);
    await waitFor(() => expect(screen.getByText('No conversations yet')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Check the pump' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    // The optimistic append waits on createSession() first (a lazy session
    // is created on the first message), so it isn't synchronous with click.
    await waitFor(() => expect(screen.getByText('Check the pump')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Sure, on it.')).toBeInTheDocument());
    expect(createSession).toHaveBeenCalledWith(token);
    expect(sendMessage).toHaveBeenCalledWith(token, 's1', 'Check the pump');
  });

  it('shows a friendly error instead of crashing when loading sessions fails', async () => {
    vi.mocked(listSessions).mockRejectedValue(new Error('Missing required permission: ai:chat'));

    renderWithTheme(<Item token={token} />);

    await waitFor(() =>
      expect(screen.getByText('Missing required permission: ai:chat')).toBeInTheDocument(),
    );
  });
});

describe('Item (token without the ai:chat permission)', () => {
  beforeEach(() => {
    vi.mocked(listSessions).mockReset();
    vi.mocked(createSession).mockReset();
    vi.mocked(listMessages).mockReset();
    vi.mocked(sendMessage).mockReset();
  });

  it('renders nothing, without calling the API', () => {
    const token = makeToken({ permissions: ['api:access'] });

    const { container } = renderWithTheme(<Item token={token} />);

    expect(container).toBeEmptyDOMElement();
    expect(listSessions).not.toHaveBeenCalled();
  });

  it('renders nothing for a token with no permissions at all', () => {
    const token = makeToken({});

    const { container } = renderWithTheme(<Item token={token} />);

    expect(container).toBeEmptyDOMElement();
    expect(listSessions).not.toHaveBeenCalled();
  });

  it('still shows the composer for a token that does carry ai:chat', async () => {
    const token = makeToken({ permissions: ['ai:chat'] });
    vi.mocked(listSessions).mockResolvedValue([]);

    renderWithTheme(<Item token={token} />);

    await waitFor(() => expect(listSessions).toHaveBeenCalledWith(token));
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });
});
