import { supabaseProjectUrl } from '../../config/project.ts';

const allowedMethods: Record<string, readonly string[]> = {
  '/auth/v1/otp': ['POST'],
  '/auth/v1/verify': ['POST'],
  '/auth/v1/token': ['POST'],
  '/auth/v1/user': ['GET'],
  '/auth/v1/authorize': ['GET'],
  '/auth/v1/user/identities': ['GET'],
  '/auth/v1/user/identities/authorize': ['GET'],
  '/auth/v1/logout': ['POST'],
  '/rest/v1/virtura_memberships': ['GET'],
  '/rest/v1/registration_waitlist': ['GET','POST'],
  '/rest/v1/beta_access_grants': ['GET'],
};

const requestHeaders = [
  'apikey',
  'authorization',
  'content-type',
  'accept',
  'prefer',
  'x-client-info',
  'x-supabase-api-version',
];

export async function onRequest({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.slice('/supabase'.length);
  if (!allowedMethods[path]?.includes(request.method)) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  // OAuth never accepts a caller-controlled callback origin. Supabase also
  // enforces an exact redirect allowlist configured in Authentication settings.
  const isOAuthRoute = path === '/auth/v1/authorize'
    || path === '/auth/v1/user/identities/authorize';
  if (isOAuthRoute) {
    const provider = url.searchParams.get('provider');
    if (provider !== 'google' && provider !== 'github') {
      return Response.json({ error: 'invalid_provider' }, { status: 400 });
    }
    const callback = url.searchParams.get('redirect_to');
    if (callback) {
      try {
        const target = new URL(callback);
        if (target.origin !== url.origin || target.pathname !== '/auth/callback'
          || target.search || target.hash) throw new Error('bad redirect');
      } catch {
        return Response.json({error: 'invalid_redirect'}, {status: 400});
      }
    }
  }
  const upstreamUrl = new URL(path + url.search, supabaseProjectUrl);
  const headers = new Headers();
  for (const name of requestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' ? undefined : request.body,
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      if (isOAuthRoute && (upstream.status === 302 || upstream.status === 303)) {
        const location = upstream.headers.get('location');
        if (location) {
          const destination = new URL(location);
          const knownDestinations = [
            'accounts.google.com',
            'github.com',
          ];
          if (destination.protocol === 'https:' &&
              knownDestinations.includes(destination.hostname) &&
              (destination.hostname !== 'github.com' ||
                destination.pathname.startsWith('/login/oauth/authorize'))) {
            return new Response(null, {
              status: upstream.status,
              headers: { Location: destination.toString(), 'Cache-Control': 'no-store' },
            });
          }
        }
      }
      throw new Error('unexpected_upstream_redirect');
    }
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'content-range', 'x-supabase-api-version', 'x-sb-error-code', 'retry-after']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('supabase_proxy_unavailable', error instanceof Error ? error.message : 'unknown_error');
    return Response.json({ error: 'upstream_unavailable' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
