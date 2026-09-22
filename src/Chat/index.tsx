import type { Theme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';

import Item from './Item';
import type { UserProfile } from './types';

type ExposedChatProps = {
  // Passed by the host so this remote's styled() components (which read
  // theme.shell.*) get a real theme — sharing @mui/material itself as a
  // federation singleton hits real bugs in a Rollup/Vite Module Federation
  // build (circular init errors, subpath imports bypassing the shared
  // scope), so the theme travels as a plain prop instead. Omit when this
  // remote is already wrapped in a compatible ThemeProvider (see ../App.tsx).
  theme?: Theme;
  // Same reasoning as `theme` — a shared state library isn't a true
  // singleton across the federation boundary either, so host app state (the
  // logged-in user's profile) travels as a prop too.
  userProfile?: UserProfile;
};

function ExposedChat({ theme, userProfile }: ExposedChatProps) {
  if (!theme) return <Item userProfile={userProfile} />;

  return (
    <ThemeProvider theme={theme}>
      <Item userProfile={userProfile} />
    </ThemeProvider>
  );
}

export default ExposedChat;
