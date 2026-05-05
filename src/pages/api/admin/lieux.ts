import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { getAuthFromCookies } from '../../../lib/auth';

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requireAdmin(cookies: Parameters<APIRoute>[0]['cookies']) {
  const auth = getAuthFromCookies(cookies);
  if (!auth || !auth.model.admin) return null;
  return auth;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!requireAdmin(cookies)) return json({ message: 'Accès refusé.' }, 403);

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    const fd = await request.formData();
    const nom = fd.get('nom') as string;
    const adresse = fd.get('adresse') as string;
    const img = fd.get('img') as File | null;

    if (!nom || !adresse) return json({ message: 'Nom et adresse requis.' }, 400);

    const data: Record<string, unknown> = { nom, adresse };
    if (img && img.size > 0) data.img = img;

    const record = await pb.collection('lieux').create(data);
    return json({ success: true, record }, 201);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur.' }, 400);
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!requireAdmin(cookies)) return json({ message: 'Accès refusé.' }, 403);

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    const fd = await request.formData();
    const id = fd.get('id') as string;
    const nom = fd.get('nom') as string;
    const adresse = fd.get('adresse') as string;
    const img = fd.get('img') as File | null;

    if (!id) return json({ message: 'ID requis.' }, 400);
    if (!nom || !adresse) return json({ message: 'Nom et adresse requis.' }, 400);

    const data: Record<string, unknown> = { nom, adresse };
    if (img && img.size > 0) data.img = img;

    const record = await pb.collection('lieux').update(id, data);
    return json({ success: true, record }, 200);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur.' }, 400);
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  if (!requireAdmin(cookies)) return json({ message: 'Accès refusé.' }, 403);

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Corps invalide.' }, 400);
  }

  if (!body.id) return json({ message: 'ID requis.' }, 400);

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    await pb.collection('lieux').delete(body.id);
    return json({ success: true }, 200);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur.' }, 400);
  }
};
