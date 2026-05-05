import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { setAuthCookie, type AuthUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Corps de requête invalide.' }, 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return json({ message: 'Email et mot de passe requis.' }, 400);
  }

  // Verify site password (no PocketBase auth required — API rules are open)
  const sitePassword = import.meta.env.SITE_PASSWORD;
  if (!sitePassword || password !== sitePassword) {
    return json({ message: 'Mot de passe incorrect.' }, 401);
  }

  try {
    // Fetch users from open PocketBase API (no auth token needed)
    const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
    const users = await pb.collection('users').getList(1, 200, {
      filter: `email = "${email.replace(/"/g, '')}"`,
    });

    if (users.items.length === 0) {
      return json({ message: 'Aucun compte trouvé pour cet email.' }, 401);
    }

    const record = users.items[0];
    const user: AuthUser = {
      id: record.id,
      email: record['email'] as string,
      name: (record['name'] as string) || '',
      avatar: (record['avatar'] as string) || '',
      admin: record['admin'] === true,
    };

    setAuthCookie(cookies, user);
    return json({ success: true }, 200);
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string };
    const message = e?.data?.message ?? e?.message ?? 'Erreur lors de la connexion.';
    return json({ message }, 500);
  }
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
