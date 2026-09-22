# ingredient-chat

A **Chat** component exposed as a Module Federation remote, built from the [`ingredient`](https://github.com/0xHackerSpace/ingredient) template's `component-template` app — see that repo's [ADR 0001](https://github.com/0xHackerSpace/ingredient/blob/main/docs/decisions/0001-usar-module-federation-com-vite-no-template-de-componentes.md) for why this shape (Vite + `@module-federation/vite`, only React shared, host state passed as props).

The component itself (`src/Chat`) and its federation config were carried over from a working prototype in [`IanOliv/wrapper`](https://github.com/IanOliv/wrapper) (container name `chat_remote`, exposed module `./Chat`), where it's consumed by a host through a runtime manifest — this repo is meant to be that remote's real, standalone home instead of living inside the host's own monorepo.

## Requirements

- Node `^20.19.0` or `>=22.12.0` (`.nvmrc` points at 22)
- npm 10+

## Getting started

```bash
nvm use            # optional, uses .nvmrc
npm install
npm run dev         # http://localhost:5174
```

Opening it directly renders `src/App.tsx`, a standalone harness that wraps `Chat` in its own theme and a placeholder user profile — useful for developing the component in isolation, but not part of what this remote exposes to a host.

## Scripts

| Command                                 | What it does                                                         |
| --------------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                           | standalone dev server                                                |
| `npm run build`                         | typecheck (`tsc`) then `vite build` — emits `dist/remoteEntry.js`    |
| `npm run preview`                       | serves the production build                                          |
| `npm run typecheck`                     | `tsc` only                                                           |
| `npm test`                              | unit tests (Vitest + Testing Library)                                |
| `npm run test:e2e`                      | Playwright, against the dev server                                   |
| `npm run test:e2e:preview`              | Playwright, against the production build (run `npm run build` first) |
| `npm run lint` / `npm run format:check` | ESLint / Prettier                                                    |

First run needs the Playwright browser: `npx playwright install chromium`.

## Consuming this from a host

`vite.config.ts` exposes `./Chat` under the federation container name `chat_remote`:

```ts
federation({
  name: 'chat_remote',
  filename: 'remoteEntry.js',
  exposes: { './Chat': './src/Chat' },
  shared: {
    react: { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
  },
});
```

A host declares it as a runtime remote (`type: 'module'` is required — see `ingredient`'s ADR 0001 for why) and passes the two props the component expects:

```tsx
const Chat = lazy(() => import('chat_remote/Chat'));

<Chat theme={hostTheme} userProfile={{ role, tenantName }} />;
```

Only `react`/`react-dom` are shared as federation singletons — not MUI, not emotion, not any state library. Theme and user data cross the boundary as plain props (`src/Chat/index.tsx`'s `ExposedChatProps`), not through shared Context.

## Deploying

Publish `dist/` (Root Directory: this repo) behind CORS — `vercel.json` already sets `Access-Control-Allow-Origin: *` and keeps `remoteEntry.js` from being cached stale (`Cache-Control: max-age=0, must-revalidate`), so a host always picks up the latest build. If the hosting platform has any deployment-level access protection (SSO, password), disable it for this project — a protected `remoteEntry.js` returns 401 to the host instead of the script.
