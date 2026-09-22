import type { ThemeOptions } from '@mui/material/styles';

import type { ShellTokens } from './theme-augmentation';

// Stand-in for a host's real "shell" tokens, used only when this remote is
// opened on its own (npm run dev) instead of federated into a host. When a
// host loads this remote, its real theme — passed as a prop, see
// src/Chat/index.tsx — takes over and this file is never read.
const shell: ShellTokens = {
  surface: { sunken: '#0F1119', level1: '#161826', level2: '#1D1F2E', level3: '#232532' },
  border: { subtle: '#232532', card: '#2A2D3D', control: '#3F424D' },
  tint: '#423A6A',
  ring: {
    0: 'none',
    1: '0 0 0 1px #2A2D3D',
    2: '0 0 0 1px #3F424D, 0 6px 18px rgba(0,0,0,.55)',
    3: '0 0 0 1px #595D6C, 0 16px 40px rgba(0,0,0,.65)',
  },
  fontFamilyMono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  motion: {
    duration: { instant: 80, state: 140, enter: 220, exit: 160, drawer: 280, layout: 320 },
    easing: {
      instant: 'linear',
      state: 'cubic-bezier(.4,0,.2,1)',
      enter: 'cubic-bezier(0,0,.2,1)',
      exit: 'cubic-bezier(.4,0,1,1)',
    },
    spring: {
      drawer: { type: 'spring', stiffness: 260, damping: 30 },
      layout: { type: 'spring', stiffness: 210, damping: 26 },
    },
  },
  layout: {
    headerMobile: 56,
    headerDesktop: 60,
    railCollapsed: 72,
    railExpanded: 232,
    bottomBar: 64,
  },
};

const standaloneTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    background: { default: '#0F1119', paper: '#161826' },
    text: { primary: '#E9E9ED', secondary: '#9397AB' },
  },
  shell,
};

export { standaloneTheme };
