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

describe('Item (no token — local-only fallback)', () => {
  it('renders the seeded conversation', () => {
    renderWithTheme(<Item />);

    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    expect(
      screen.getByText('Checking whether the boiler loop is still reporting.'),
    ).toBeInTheDocument();
  });

  it('does not show a profile line when none is given', () => {
    renderWithTheme(<Item />);

    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it('shows the profile the host passes', () => {
    renderWithTheme(<Item userProfile={{ role: 'operator', tenantName: 'Acme Plant 4' }} />);

    expect(screen.getByText('Signed in as operator · Acme Plant 4')).toBeInTheDocument();
  });

  it('sends a message and clears the draft', () => {
    renderWithTheme(<Item />);

    const input = screen.getByLabelText('Message');
    fireEvent.change(input, { target: { value: 'Restarting the compressor.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(screen.getByText('Restarting the compressor.')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('disables send while the draft is empty', () => {
    renderWithTheme(<Item />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('does not show the session picker without a token', () => {
    renderWithTheme(<Item />);

    expect(screen.queryByLabelText('Conversation')).not.toBeInTheDocument();
  });
});

describe('Item (with a token — real wrapper-api sessions)', () => {
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

    renderWithTheme(<Item token="tok" />);

    await waitFor(() => expect(screen.getByText('Ping')).toBeInTheDocument());
    expect(screen.getByText('Boiler check')).toBeInTheDocument();
  });

  it('shows an empty state, not a crash, when there are no sessions yet', async () => {
    vi.mocked(listSessions).mockResolvedValue([]);

    renderWithTheme(<Item token="tok" />);

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

    renderWithTheme(<Item token="tok" />);
    await waitFor(() => expect(screen.getByText('No conversations yet')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Check the pump' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    // The optimistic append waits on createSession() first (a lazy session
    // is created on the first message), so it isn't synchronous with click.
    await waitFor(() => expect(screen.getByText('Check the pump')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Sure, on it.')).toBeInTheDocument());
    expect(createSession).toHaveBeenCalledWith('tok');
    expect(sendMessage).toHaveBeenCalledWith('tok', 's1', 'Check the pump');
  });

  it('shows a friendly error instead of crashing when loading sessions fails', async () => {
    vi.mocked(listSessions).mockRejectedValue(new Error('Missing required permission: ai:chat'));

    renderWithTheme(<Item token="tok" />);

    await waitFor(() =>
      expect(screen.getByText('Missing required permission: ai:chat')).toBeInTheDocument(),
    );
  });
});
