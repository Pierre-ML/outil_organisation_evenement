import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { getAuthFromCookies, setAuthCookie, type AuthUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuthFromCookies(cookies);
  if (!auth) return json({ message: 'Non autorisé.' }, 401);

  try {
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);

    const fd = await request.formData();
    const avatar = fd.get('avatar') as File | null;

    if (!avatar || avatar.size === 0) {
      return json({ message: 'Aucun fichier fourni.' }, 400);
    }

    const record = await pb.collection('users').update(auth.model.id, { avatar });

    const updatedUser: AuthUser = {
      id: record.id,
      email: record['email'] as string,
      name: (record['name'] as string) || '',
      avatar: (record['avatar'] as string) || '',
      admin: record['admin'] === true,
    };

    setAuthCookie(cookies, updatedUser);
    return json({ success: true, avatar: record['avatar'] }, 200);
  } catch (err: unknown) {
    const e = err as { message?: string };
    return json({ message: e?.message ?? 'Erreur lors de l\'upload.' }, 400);
  }
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
