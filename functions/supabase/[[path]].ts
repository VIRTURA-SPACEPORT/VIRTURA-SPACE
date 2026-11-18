import { supabaseProjectUrl } from '../../config/project.ts';

const allowedMethods: Record<string, readonly string[]> = {
  '/auth/v1/otp': ['POST'],
  '/auth/v1/verify': ['POST'],
  '/auth/v1/token': ['POST'],
  '/auth/v1/user': ['GET'],
  '/auth/v1/logout': ['POST'],
  '/rest/v1/virtura_memberships': ['GET'],
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
