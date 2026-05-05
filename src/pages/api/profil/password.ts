import type { APIRoute } from 'astro';
import PocketBase from 'pocketbase';
import { getAuthFromCookies } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, cookies }) => {
  const auth = getAuthFromCookies(cookies);
  if (!auth) return json({ message: 'Non autorisé.' }, 401);

  let body: { oldPassword?: string; newPassword?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Corps de requête invalide.' }, 400);
  }

  const { oldPassword, newPassword, confirmPassword } = body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return json({ message: 'Tous les champs sont requis.' }, 400);
  }

  // Old password must match the site password
  if (oldPassword !== import.meta.env.SITE_PASSWORD) {
    return json({ message: 'Mot de passe actuel incorrect.' }, 400);
  }

  if (newPassword !== confirmPassword) {
    return json({ message: 'Les nouveaux mots de passe ne correspondent pas.' }, 400);
  }

  if (newPassword.length < 8) {
    return json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' }, 400);
  }

  // Note: SITE_PASSWORD is in .env — to change it, update the env variable on the server.
  return json({
    success: false,
    message: 'Pour changer le mot de passe du site, modifie la variable SITE_PASSWORD dans le fichier .env sur le serveur.',
  }, 400);
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
