import { defineMiddleware } from 'astro:middleware';
import PocketBase from 'pocketbase';
import { getAuthFromCookies } from './lib/auth';

const PROTECTED = ['/dashboard', '/stock', '/lieux', '/profil', '/admin'];
const ADMIN_ONLY = ['/admin'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtected = PROTECTED.some((r) => pathname === r || pathname.startsWith(r + '/'));
  const isAdminOnly = ADMIN_ONLY.some((r) => pathname === r || pathname.startsWith(r + '/'));

  if (!isProtected) return next();

  const auth = getAuthFromCookies(context.cookies);
  if (!auth) return context.redirect('/login');

  if (isAdminOnly && !auth.model.admin) return context.redirect('/dashboard');

  // Provide an unauthenticated PocketBase client (API rules are open)
  const pb = new PocketBase(import.meta.env.POCKETBASE_URL);
  context.locals.auth = auth;
  context.locals.pb = pb;

  return next();
});
