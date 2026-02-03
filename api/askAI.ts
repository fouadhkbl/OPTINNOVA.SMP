export default function handler(request: Request) {
  return new Response(JSON.stringify({ error: 'AI Service Removed' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}