import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { getAuthFromCookies } from '../../../lib/auth';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const auth = getAuthFromCookies(cookies);
  if (!auth) return json({ message: 'Non autorisé.' }, 401);

  const { id } = params;
  if (!id) return json({ message: 'ID manquant.' }, 400);

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    const record = await pb.collection('stockage').getOne(id);

    if (record['qui'] !== auth.model.id && !auth.model.admin) {
      return json({ message: 'Vous ne pouvez supprimer que vos propres articles.' }, 403);
    }

    await pb.collection('stockage').delete(id);
    return json({ success: true }, 200);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur lors de la suppression.' }, 400);
  }
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
