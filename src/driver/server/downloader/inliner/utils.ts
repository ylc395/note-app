import { AsyncLocalStorage } from 'node:async_hooks';

export function isLocalUrl(str: string) {
  return str.startsWith('data:') || str.startsWith('blob:') || str.startsWith('#');
}

export async function urlToDataUrl(url: string, mimeType?: string) {
  const response = await fetch(url);

  if (response.ok) {
    const contentType = response.headers.get('content-type') || mimeType;

    if (!contentType) {
      return '';
    }

    if (contentType === 'image/svg+xml') {
      const text = await response.text();
      return `data:image/svg+xml,${encodeURIComponent(text)}`;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  }

  return '';
}

export const als = new AsyncLocalStorage<{ urlToDataUrl: typeof urlToDataUrl; baseUrl: string }>();
