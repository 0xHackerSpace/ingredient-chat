interface TokenPayload {
  permissions?: string[];
}

// wrapper-api's JWT payload carries permissions as flattened "resource:action"
// strings (unlike the HTTP response body of /login, which nests raw D1 rows) —
// see wrapper's utils/auth/types.ts for the same distinction on the host side.
// This is a client-side courtesy check only: the ai worker still re-validates
// on every request, so a forged or stale token can't grant real access here,
// it just avoids showing a composer that's guaranteed to be rejected.
function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    return JSON.parse(atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
}

export function hasPermission(token: string, permission: string): boolean {
  return decodeTokenPayload(token)?.permissions?.includes(permission) ?? false;
}
