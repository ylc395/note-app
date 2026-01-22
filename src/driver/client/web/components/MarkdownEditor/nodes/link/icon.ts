import z from 'zod';
import { File, Lightbulb, MessageSquare, NotebookText, createElement } from 'lucide';
import { createQuery } from 'mobx-tanstack-query/preset';
import { when } from 'mobx';

import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';
import Icon from '#web/components/Icon';
import { remoteIconStoreName } from '#domain/client/app/model/note/editor/BaseEditor';
import type { NoteVO } from '#domain/shared/model/note';

type Icon = Partial<Pick<NoteVO, 'icon' | 'mimeType'>> & { type: RouteTypes };

export function addIcon(linkDom: HTMLAnchorElement) {
  const remote = container.resolve(remoteToken);
  const db = container.resolve(documentDbToken);
  const url = linkDom.href;
  const abortController = new AbortController();

  const icon = createQuery<Icon | Blob | null>(
    async ({ signal }) => {
      const parsed = parseAppUrl(url);

      if (parsed) {
        if (parsed.type === RouteTypes.Note) {
          const note = await remote.note.queryOneById.query(parsed.id, { signal });
          return { type: RouteTypes.Note, icon: note.icon, mimeType: note.mimeType } as const;
        }

        return { type: parsed.type };
      }

      const localResult = await db.getByKey(
        remoteIconStoreName,
        url,
        z.object({ data: z.instanceof(Blob), createdAt: z.number() }),
      );

      if (localResult) {
        return localResult.data;
      }

      const result = await remote.file.queryIcon.query(url, { signal });

      if (!result) {
        return null;
      }

      const blob = new Blob([result as ArrayBuffer]);

      await db.put(remoteIconStoreName, {
        url: url,
        data: blob,
        createdAt: Date.now(),
      });

      return blob;
    },
    { queryKey: ['remote-icon', { url }], abortSignal: abortController.signal },
  );

  let blobUrl: string | undefined;

  when(
    () => icon.isSuccess,
    () => {
      if (icon.data instanceof Blob) {
        const blobUrl = URL.createObjectURL(icon.data);
        linkDom.style.setProperty('--icon-content', `url(${blobUrl})`);
        return;
      }

      let iconElement: ReturnType<typeof createElement> | undefined;

      if (icon.data?.type === RouteTypes.Note) {
        iconElement = createElement(NotebookText);
      }

      if (icon.data?.type === RouteTypes.Memo) {
        iconElement = createElement(Lightbulb);
      }

      if (icon.data?.type === RouteTypes.Annotation) {
        iconElement = createElement(MessageSquare);
      }

      if (icon.data?.type === RouteTypes.File) {
        iconElement = createElement(File);
      }

      if (iconElement) {
        linkDom.style.setProperty(
          '--icon-content',
          `url(data:image/svg+xml,${encodeURIComponent(iconElement.outerHTML)})`,
        );
      }
    },
    { signal: abortController.signal },
  );

  return () => {
    abortController.abort();

    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  };
}
