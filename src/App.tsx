import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Chat from './Chat';
import { standaloneTheme } from './standalone-theme';

// Standalone harness: renders the exposed component on its own so it can be
// developed and tested without a host. Not part of what this remote exposes.
const theme = createTheme(standaloneTheme);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ height: '100vh', padding: 24, boxSizing: 'border-box' }}>
        <Chat userProfile={{ role: 'operator', tenantName: 'Standalone preview' }} />
      </div>
    </ThemeProvider>
  );
}

export default App;
