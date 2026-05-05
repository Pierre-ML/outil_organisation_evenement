import PocketBase from 'pocketbase';

export function createPocketBase(): PocketBase {
  return new PocketBase(import.meta.env.POCKETBASE_URL);
}

export function getFileUrl(collection: string, recordId: string, filename: string): string {
  return `${import.meta.env.POCKETBASE_URL}/api/files/${collection}/${recordId}/${filename}`;
}
