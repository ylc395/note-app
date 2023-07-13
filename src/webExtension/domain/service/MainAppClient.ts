import type { MaterialDTO } from 'shared/interface/material';

export default class MainAppClient {
  async save(payload: { title: string; content: string; type: 'html' | 'md'; sourceUrl: string }) {
    const res = await fetch('http://localhost:3001/materials', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.title,
        sourceUrl: payload.sourceUrl,
        file: {
          mimeType: payload.type === 'html' ? 'text/html' : 'text/markdown',
          data: payload.content,
        },
        parentId: '8919e8a897094aebbbda0df7f58ef3ec',
      } satisfies MaterialDTO),
      headers: { 'Content-Type': 'application/json', Authorization: 'e36333de-d3eb-4e9a-b17d-55b47a9e7827' },
    });
  }
}
