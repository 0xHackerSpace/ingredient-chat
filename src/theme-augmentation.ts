// Type augmentation for the host shell's custom "shell" theme tokens
// (surface/border/tint/ring/motion/layout), which this component's
// styled() calls read via `theme.shell.*`. Needed only so TypeScript can
// typecheck this package — at runtime the actual theme object always comes
// from the host (or from ./standalone-theme.ts when this remote runs on its
// own, outside a host shell).
type ShellTokens = {
  surface: {
    sunken: string;
    level1: string;
    level2: string;
    level3: string;
  };
  border: {
    subtle: string;
    card: string;
    control: string;
  };
  tint: string;
  ring: Record<0 | 1 | 2 | 3, string>;
  fontFamilyMono: string;
  motion: {
    duration: Record<'instant' | 'state' | 'enter' | 'exit' | 'drawer' | 'layout', number>;
    easing: Record<'instant' | 'state' | 'enter' | 'exit', string>;
    spring: {
      drawer: { type: string; stiffness: number; damping: number };
      layout: { type: string; stiffness: number; damping: number };
    };
  };
  layout: {
    headerMobile: number;
    headerDesktop: number;
    railCollapsed: number;
    railExpanded: number;
    bottomBar: number;
  };
};

declare module '@mui/material/styles' {
  interface Theme {
    shell: ShellTokens;
  }
  interface ThemeOptions {
    shell?: ShellTokens;
  }
}

export type { ShellTokens };
