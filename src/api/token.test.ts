import { hasPermission } from './token';

function makeToken(payload: Record<string, unknown>): string {
  const base64url = (value: string) =>
    btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));

  return `${header}.${body}.signature`;
}

describe('hasPermission', () => {
  it('is true when the permission is in the token payload', () => {
    const token = makeToken({ permissions: ['ai:chat', 'api:access'] });

    expect(hasPermission(token, 'ai:chat')).toBe(true);
  });

  it('is false when the permission is missing', () => {
    const token = makeToken({ permissions: ['api:access'] });

    expect(hasPermission(token, 'ai:chat')).toBe(false);
  });

  it('is false when the token has no permissions at all', () => {
    const token = makeToken({ sub: 'user-1' });

    expect(hasPermission(token, 'ai:chat')).toBe(false);
  });

  it('is false for a malformed token instead of throwing', () => {
    expect(hasPermission('not-a-jwt', 'ai:chat')).toBe(false);
  });
});
