import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { getAuthFromCookies } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, cookies }) => {
  const auth = getAuthFromCookies(cookies);
  if (!auth || !auth.model.admin) {
    return json({ message: 'Accès refusé.' }, 403);
  }

  let body: { visible?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Corps invalide.' }, 400);
  }

  const visible = body.visible === true;

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    const settings = await pb.collection('settings').getList(1, 1, {
      filter: 'key = "lieux_visible"',
    });

    const value = visible ? 'true' : 'false';

    if (settings.items.length > 0) {
      await pb.collection('settings').update(settings.items[0].id, { value });
    } else {
      await pb.collection('settings').create({ key: 'lieux_visible', value });
    }

    return json({ success: true, visible }, 200);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur.' }, 400);
  }
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
