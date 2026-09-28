import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { Plus } from '@phosphor-icons/react';

import type { ChatSession } from '../api/types';

type SessionPickerProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNewSession: () => void;
  disabled?: boolean;
};

function sessionLabel(session: ChatSession): string {
  return session.title?.trim() || 'New conversation';
}

// Deliberately a compact header row, not a full sidebar — Chat is embedded in
// the host's content area, not given a whole screen to itself.
function SessionPicker({
  sessions,
  activeSessionId,
  onSelect,
  onNewSession,
  disabled,
}: SessionPickerProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
      <Select
        value={activeSessionId ?? ''}
        onChange={(event) => onSelect(event.target.value)}
        displayEmpty
        size="small"
        disabled={disabled || sessions.length === 0}
        sx={{ flexGrow: 1, minWidth: 0 }}
        inputProps={{ 'aria-label': 'Conversation' }}
        renderValue={(value) => {
          if (!value) return 'No conversations yet';
          const session = sessions.find((candidate) => candidate.id === value);
          return session ? sessionLabel(session) : 'Conversation';
        }}
      >
        {sessions.map((session) => (
          <MenuItem key={session.id} value={session.id}>
            {sessionLabel(session)}
          </MenuItem>
        ))}
      </Select>
      <Tooltip title="New conversation" arrow>
        <span>
          <IconButton
            onClick={onNewSession}
            disabled={disabled}
            aria-label="New conversation"
            size="small"
          >
            <Plus size={16} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

export default SessionPicker;
