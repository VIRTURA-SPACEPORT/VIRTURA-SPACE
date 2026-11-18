import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/supabase/[[path]].ts';

test('uses edge-supported redirects and forwards only authentication headers', async (context) => {
  const fetch = context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.origin, 'https://cqevzwttlvqzgqztmwcy.supabase.co');
    assert.equal(url.pathname, '/auth/v1/user');
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.get('authorization'), 'Bearer test-user-token');
    assert.equal(options.headers.get('apikey'), 'test-publishable-key');
    assert.equal(options.headers.has('cookie'), false);
    return Response.json({ id: 'test-user' });
  });

  const response = await onRequest({ request: new Request('https://example.test/supabase/auth/v1/user', {
    headers: {
      authorization: 'Bearer test-user-token',
      apikey: 'test-publishable-key',
      cookie: 'unrelated-cookie=value',
    },
  }) });

  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { id: 'test-user' });
});

test('refuses administrative routes and member writes', async (context) => {
  const fetch = context.mock.method(globalThis, 'fetch', () => {
    throw new Error('An unsupported route reached upstream');
  });
  for (const [path, method] of [
    ['/auth/v1/admin/users', 'GET'],
    ['/rest/v1/virtura_memberships', 'PATCH'],
  ]) {
    const response = await onRequest({ request: new Request('https://example.test/supabase' + path, { method }) });
    assert.equal(response.status, 404);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('rejects upstream redirects without exposing their location', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response(null, {
    status: 302,
    headers: { location: 'https://other.example.test' },
  }));
  context.mock.method(console, 'error', () => {});
  const response = await onRequest({ request: new Request('https://example.test/supabase/auth/v1/user') });
  assert.equal(response.status, 503);
  assert.equal(response.headers.has('location'), false);
  assert.deepEqual(await response.json(), { error: 'upstream_unavailable' });
});
