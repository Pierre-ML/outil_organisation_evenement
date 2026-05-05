import type { AstroCookies } from 'astro';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  admin: boolean;
}

export interface AuthData {
  model: AuthUser;
}

const COOKIE_NAME = 'pb_auth';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};

export function setAuthCookie(cookies: AstroCookies, model: AuthUser): void {
  cookies.set(COOKIE_NAME, JSON.stringify({ model }), COOKIE_OPTIONS);
}

export function clearAuthCookie(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export function getAuthFromCookies(cookies: AstroCookies): AuthData | null {
  const raw = cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Support both old format {token, model} and new format {model}
    if (parsed?.model?.id) return { model: parsed.model };
    return null;
  } catch {
    return null;
  }
}
