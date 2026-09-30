import { json } from '@sveltejs/kit';

export function GET() {
  return json(
    { status: 'ok', service: 'taskiller-web' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
