export async function onRequestGet() {
  return new Response(JSON.stringify({ status: 'ok', service: 'cloudflare-pages' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}
