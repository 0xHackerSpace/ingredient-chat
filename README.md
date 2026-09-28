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

Opening it directly renders `src/App.tsx`, a standalone harness that wraps `Chat` in its own theme and a placeholder user profile — useful for developing the component in isolation, but not part of what this remote exposes to a host. The standalone harness never passes a `token`, so it always runs in local-only mode (see below) — it's for developing the UI, not the wrapper-api integration.

### Environment

```bash
cp .env.example .env
```

| Variable          | What it's for                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_AI_API_URL` | Base URL of [`wrapper-api`](https://github.com/0xHackerSpace/wrapper-api)'s `ai` worker (sessions, messages) — never hardcoded, see `src/api/client.ts`. |

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

A host declares it as a runtime remote (`type: 'module'` is required — see `ingredient`'s ADR 0001 for why) and passes the props the component expects:

```tsx
const Chat = lazy(() => import('chat_remote/Chat'));

<Chat theme={hostTheme} userProfile={{ role, tenantName }} token={session.token} />;
```

Only `react`/`react-dom` are shared as federation singletons — not MUI, not emotion, not any state library. Theme, user data and the session token cross the boundary as plain props (`src/Chat/index.tsx`'s `ExposedChatProps`), not through shared Context.

## Sessions (talking to wrapper-api)

Without a `token`, Chat falls back to a local-only seeded conversation — nothing is sent anywhere. With one, it calls [`wrapper-api`](https://github.com/0xHackerSpace/wrapper-api)'s `ai` worker for real (`src/api/client.ts`, `VITE_AI_API_URL`):

- Lists the signed-in user's chat sessions on mount and opens the most recent one.
- The header row (`src/Chat/SessionPicker.tsx`) lets you switch between sessions or start a new one.
- Sending a message with no session selected yet creates one lazily first — no "New conversation" click required before you can say anything.
- Both persisted history (`GET /v1/sessions/:id/messages`) and new turns (`POST /v1/sessions/:id/messages`) go through the same session, so a conversation survives a reload as long as the token does.

Access itself is gated on `ai:chat` being present in the token's own payload (`src/api/token.ts`), checked client-side before any request goes out — a user without it sees an explanatory message instead of a composer that would just be rejected. This is a courtesy check only; the ai worker still re-validates every request. A permission error surfaced by the API for some other reason still shows as an inline message instead of crashing.

## Deploying

Publish `dist/` (Root Directory: this repo) behind CORS — `vercel.json` already sets `Access-Control-Allow-Origin: *` and keeps `remoteEntry.js` from being cached stale (`Cache-Control: max-age=0, must-revalidate`), so a host always picks up the latest build. If the hosting platform has any deployment-level access protection (SSO, password), disable it for this project — a protected `remoteEntry.js` returns 401 to the host instead of the script.
