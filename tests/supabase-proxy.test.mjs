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

test('new waitlist users cannot access membership writes or grant writes via proxy', async (context) => {
  const upstream = context.mock.method(globalThis, 'fetch', () => { throw new Error('write bypass'); });
  for (const [path, method] of [
    ['/rest/v1/beta_access_grants', 'POST'],
    ['/rest/v1/beta_access_grants', 'PATCH'],
    ['/rest/v1/registration_waitlist', 'PATCH'],
    ['/rest/v1/virtura_memberships', 'POST'],
    ['/auth/v1/admin/users', 'POST'],
  ]) {
    const response = await onRequest({ request: new Request('https://example.test/supabase' + path, { method }) });
    assert.equal(response.status, 404);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test('waitlist self-read and pending insert are exposed only through database RLS', async (context) => {
  const upstream = context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.pathname, '/rest/v1/registration_waitlist');
    assert.equal(options.headers.get('authorization'), 'Bearer test-user-token');
    return Response.json([]);
  });
  for (const method of ['GET','POST']) {
    const response = await onRequest({ request: new Request('https://example.test/supabase/rest/v1/registration_waitlist', {
      method, headers: { authorization:'Bearer test-user-token', apikey:'test-publishable-key' },
      ...(method === 'POST' ? { body: '{}' } : {}),
    }) });
    assert.equal(response.status, 200);
  }
  assert.equal(upstream.mock.callCount(), 2);
});

test('OAuth requests reject unapproved providers and untrusted callback URLs', async (context) => {
  const upstream = context.mock.method(globalThis, 'fetch', () => { throw new Error('Unsafe upstream call'); });
  for (const query of [
    '?provider=facebook',
    '?provider=github&redirect_to=https%3A%2F%2Fevil.example%2Fauth%2Fcallback',
    '?provider=google&redirect_to=https%3A%2F%2Fexample.test%2Fevil',
  ]) {
    const response = await onRequest({ request: new Request(
      'https://example.test/supabase/auth/v1/authorize' + query) });
    assert.equal(response.status, 400);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test('OAuth grants redirect only to known trusted provider endpoints', async (context) => {
  const upstream = context.mock.method(globalThis, 'fetch', async () =>
    new Response(null, {status: 302, headers: { location: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test' }}));
  const response = await onRequest({ request: new Request(
    'https://example.test/supabase/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fexample.test%2Fauth%2Fcallback') });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location')?.startsWith('https://accounts.google.com/'), true);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(upstream.mock.callCount(), 1);
});

test('OAuth refuses redirects to arbitrary hosts', async (context) => {
  context.mock.method(globalThis, 'fetch', async () =>
    new Response(null, {status: 302, headers: { location: 'https://evil.example/o/oauth2/v2/auth' }}));
  context.mock.method(console, 'error', () => {});
  const response = await onRequest({ request: new Request(
    'https://example.test/supabase/auth/v1/authorize?provider=google') });
  assert.equal(response.status, 503);
  assert.equal(response.headers.has('location'), false);
});
