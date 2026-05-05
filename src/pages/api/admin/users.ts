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
  const auth = requireAdmin(cookies);
  if (!auth) return json({ message: 'Accès refusé.' }, 403);

  let body: { email?: string; name?: string; password?: string; admin?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Corps invalide.' }, 400);
  }

  const { email, name, admin = false } = body;

  if (!email || !name) {
    return json({ message: 'Email et nom requis.' }, 400);
  }

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    const sitePassword = import.meta.env.SITE_PASSWORD || 'changeme';

    const record = await pb.collection('users').create({
      email,
      name,
      password: sitePassword,
      passwordConfirm: sitePassword,
      admin,
    });

    return json({ success: true, record }, 201);
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    const message = e?.data?.message ?? e?.message ?? 'Erreur lors de la création.';
    return json({ message }, 400);
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const auth = requireAdmin(cookies);
  if (!auth) return json({ message: 'Accès refusé.' }, 403);

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Corps invalide.' }, 400);
  }

  const { id } = body;
  if (!id) return json({ message: 'ID requis.' }, 400);

  if (id === auth.model.id) {
    return json({ message: 'Tu ne peux pas supprimer ton propre compte.' }, 400);
  }

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    await pb.collection('users').delete(id);
    return json({ success: true }, 200);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur lors de la suppression.' }, 400);
  }
};
