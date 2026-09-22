import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

// Chat was not designed; it is built from the shell's tokens and the module
// contract — no new steps in the type, radius or spacing scales.

const ChatSurface = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  borderRadius: 8,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shell.ring[1],
}));

const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
}));

const Message = styled(Box, { shouldForwardProp: (prop) => prop !== 'own' })<{ own: boolean }>(
  ({ theme, own }) => ({
    maxWidth: '80%',
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
    borderRadius: 8,
    fontSize: '0.9375rem',
    lineHeight: 1.55,
    wordBreak: 'break-word',
    alignSelf: own ? 'flex-end' : 'flex-start',
    color: theme.palette.text.primary,
    backgroundColor: own ? theme.shell.tint : theme.shell.surface.level2,
    border: own ? 'none' : `1px solid ${theme.shell.border.subtle}`,
  }),
);

const Composer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.shell.border.subtle}`,
}));

export { ChatSurface, MessageList, Message, Composer };
