import { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { PaperPlaneTilt, ShieldWarning, WarningCircle } from '@phosphor-icons/react';

import { createSession, listMessages, listSessions, sendMessage } from '../api/client';
import { hasPermission } from '../api/token';
import type { ChatSession } from '../api/types';
import SessionPicker from './SessionPicker';
import { ChatSurface, Composer, Message, MessageList } from './styled';
import type { ChatMessage, UserProfile } from './types';

const seed: ChatMessage[] = [
  { id: 1, own: false, text: 'Hello, how can I help you?' },
  { id: 2, own: true, text: 'Checking whether the boiler loop is still reporting.' },
  { id: 3, own: false, text: 'Header pressure has been out of range for about nine seconds.' },
];

// wrapper-api's ai worker requires this permission on /v1/sessions* — see
// ../api/token.ts.
const CHAT_PERMISSION = 'ai:chat';

type ItemProps = {
  // Passed by the host. Sharing a state library (Recoil, etc.) as a
  // federation singleton doesn't reliably cross this boundary — a remote's
  // hooks resolve to its own separate module/Context, not the host's — so
  // app state travels as a plain prop instead, same as the theme.
  userProfile?: UserProfile;
  // The signed-in user's session token. Without it, Chat falls back to the
  // local-only seeded conversation — same graceful-degradation rule as
  // userProfile/theme — so a host that hasn't wired auth through yet, or the
  // standalone dev harness (see ../App.tsx), still has something to look at.
  token?: string;
};

function Item({ userProfile, token }: ItemProps) {
  const [conversation, setConversation] = useState<ChatMessage[]>(token ? [] : seed);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState('');

  // Checked from the token itself, not from an API response — a user without
  // ai:chat never sees a composer that's guaranteed to be rejected. No token
  // at all still falls back to the local-only demo (see ItemProps.token).
  const hasChatAccess = !token || hasPermission(token, CHAT_PERMISSION);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [conversation]);

  // Load the signed-in user's sessions once a token shows up, and open the
  // most recently active one — listSessions() is already ordered that way.
  useEffect(() => {
    if (!token || !hasChatAccess) return;

    let cancelled = false;
    setIsLoadingSessions(true);
    setApiError('');

    listSessions(token)
      .then((fetched) => {
        if (cancelled) return;
        setSessions(fetched);
        setActiveSessionId(fetched[0]?.id ?? null);
        if (!fetched[0]) setConversation([]);
      })
      .catch((err) => {
        if (!cancelled) {
          setApiError(err instanceof Error ? err.message : 'Failed to load conversations');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSessions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, hasChatAccess]);

  // Load the active session's history whenever the selection changes. Skipped
  // once right after *this* component creates a session (lazily on first
  // send, or via "New conversation") — it's known to be empty, and fetching
  // it anyway races the optimistic message send() just appended, sometimes
  // clobbering it with the pre-send (empty) server state.
  const skipNextMessagesLoadRef = useRef(false);

  useEffect(() => {
    if (!token || !activeSessionId) return;

    if (skipNextMessagesLoadRef.current) {
      skipNextMessagesLoadRef.current = false;
      return;
    }

    let cancelled = false;

    listMessages(token, activeSessionId)
      .then((messages) => {
        if (cancelled) return;
        setConversation(
          messages.map((message) => ({
            id: message.id,
            own: message.role === 'user',
            text: message.content,
          })),
        );
      })
      .catch((err) => {
        if (!cancelled) setApiError(err instanceof Error ? err.message : 'Failed to load messages');
      });

    return () => {
      cancelled = true;
    };
  }, [token, activeSessionId]);

  const handleNewSession = useCallback(async () => {
    if (!token || !hasChatAccess) return;

    setApiError('');
    try {
      const session = await createSession(token);
      setSessions((current) => [session, ...current]);
      skipNextMessagesLoadRef.current = true;
      setActiveSessionId(session.id);
      setConversation([]);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to start a new conversation');
    }
  }, [token, hasChatAccess]);

  async function send(event: React.FormEvent) {
    event.preventDefault();

    const text = draft.trim();
    if (!text) return;

    if (!token) {
      // Local-only mode: nothing to call, just echo it into the transcript.
      setConversation((current) => [...current, { id: Date.now(), own: true, text }]);
      setDraft('');
      return;
    }

    // The composer is hidden whenever this is false — reachable only if
    // something calls send() directly, not through a real user click.
    if (!hasChatAccess) return;

    setDraft('');
    setApiError('');

    let sessionId = activeSessionId;
    // Lazily create a session on the first message — no "New conversation"
    // click required before you can say anything.
    if (!sessionId) {
      try {
        const session = await createSession(token);
        sessionId = session.id;
        setSessions((current) => [session, ...current]);
        skipNextMessagesLoadRef.current = true;
        setActiveSessionId(session.id);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Failed to start a new conversation');
        return;
      }
    }

    const optimisticId = `pending-${Date.now()}`;
    setConversation((current) => [...current, { id: optimisticId, own: true, text }]);
    setIsSending(true);

    try {
      const result = await sendMessage(token, sessionId, text);
      setConversation((current) => [
        ...current,
        { id: `${optimisticId}-reply`, own: false, text: result.message.content },
      ]);
      // Title/ordering are server-computed (the first message becomes the
      // title) — refetch quietly so the picker doesn't drift from the server.
      listSessions(token)
        .then(setSessions)
        .catch(() => {});
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Typography variant="h1">Conversation</Typography>
      <Box sx={{ mt: 0.5, mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          A prototype, but a destination people expect to find.
        </Typography>
        {userProfile && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Signed in as {userProfile.role} · {userProfile.tenantName}
          </Typography>
        )}
      </Box>

      {token && !hasChatAccess ? (
        <ChatSurface
          sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3 }}
        >
          <Box sx={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ShieldWarning size={28} style={{ margin: '0 auto' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Your account doesn&apos;t have chat access yet — ask an admin to grant the{' '}
              {CHAT_PERMISSION} permission.
            </Typography>
          </Box>
        </ChatSurface>
      ) : (
        <>
          {token && (
            <SessionPicker
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelect={setActiveSessionId}
              onNewSession={handleNewSession}
              disabled={isLoadingSessions}
            />
          )}

          {apiError && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main', mb: 1.5 }}
            >
              <WarningCircle size={16} />
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                {apiError}
              </Typography>
            </Box>
          )}

          <ChatSurface>
            <MessageList>
              {isLoadingSessions && (
                <CircularProgress size={20} sx={{ alignSelf: 'center', my: 2 }} />
              )}
              {conversation.map((message) => (
                <Message key={message.id} own={message.own}>
                  {message.text}
                </Message>
              ))}
              <div ref={endRef} />
            </MessageList>

            <Composer component="form" onSubmit={send}>
              <TextField
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write a message…"
                size="small"
                fullWidth
                multiline
                maxRows={4}
                disabled={isSending}
                inputProps={{ 'aria-label': 'Message' }}
              />
              <IconButton type="submit" aria-label="Send" disabled={!draft.trim() || isSending}>
                <PaperPlaneTilt size={18} weight="fill" />
              </IconButton>
            </Composer>
          </ChatSurface>
        </>
      )}
    </Box>
  );
}

export default Item;
