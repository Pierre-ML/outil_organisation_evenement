import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { getAuthFromCookies } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuthFromCookies(cookies);
  if (!auth) return json({ message: 'Non autorisé.' }, 401);

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);

    const fd = await request.formData();
    const nom = fd.get('nom') as string;
    const combien = fd.get('combien') as string;
    const type = fd.get('type') as string;
    const img = fd.get('img') as File | null;

    if (!nom || !combien || !type) {
      return json({ message: 'Nom, quantité et type requis.' }, 400);
    }

    const data: Record<string, unknown> = {
      qui: auth.model.id,
      nom,
      combien: Number(combien),
      type,
    };

    if (img && img.size > 0) data.img = img;

    const record = await pb.collection('stockage').create(data);
    return json({ success: true, record }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur lors de l\'ajout.' }, 400);
  }
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
