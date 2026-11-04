/// <reference types="vite/client" />
export const isStaticSite = import.meta.env.VITE_STATIC_SITE === true;
export async function api(resource: string, body?: unknown) {
  if (isStaticSite) return (await import('./static-api')).staticApi(resource, body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const r = await fetch('/api/' + resource, {
    headers,
    ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
  return d;
}
