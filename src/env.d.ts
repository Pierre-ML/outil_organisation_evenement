/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly POCKETBASE_URL: string;
  readonly PUBLIC_POCKETBASE_URL: string;
  readonly SITE_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    auth: import('./lib/auth').AuthData | null;
    pb: import('pocketbase').default | null;
  }
}
