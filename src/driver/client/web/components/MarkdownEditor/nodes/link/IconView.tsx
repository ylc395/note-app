import { createQuery } from 'mobx-tanstack-query/preset';
import z from 'zod';
import { createEffect, createSignal, Match, onCleanup, Switch } from 'solid-js';

import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';
import Icon from '#web/components/common/Icon';
import { FileIcon, LightbulbIcon, MessageSquareIcon } from 'lucide-solid';
import { remoteIconStoreName } from '#domain/client/app/model/note/editor/BaseEditor';
import type { NoteVO } from '#domain/shared/model/note';

type Icon = Partial<Pick<NoteVO, 'icon' | 'mimeType'>> & { type: RouteTypes };

export default function LinkIcon(props: { url: string }) {
  const [blobUrl, setBlobUrl] = createSignal<string>();
  const remote = container.resolve(remoteToken);
  const db = container.resolve(documentDbToken);

  const icon = createQuery(
    async () => {
      const parsed = parseAppUrl(props.url);

      if (parsed) {
        if (parsed.type === RouteTypes.Note) {
          const note = await remote.note.queryOneById.query(parsed.id);

          return {
            type: RouteTypes.Note,
            icon: note.icon,
            mimeType: note.mimeType,
          };
        }

        return { type: parsed.type };
      }

      const localResult = await db.getByKey(
        remoteIconStoreName,
        props.url,
        z.object({
          data: z.instanceof(Blob).nullable(),
          createdAt: z.number(),
        }),
      );

      if (localResult) {
        return localResult.data;
      }

      const result = await remote.file.queryIcon.query(props.url);
      const blob = result && new Blob([result as ArrayBuffer]);

      await db.put(remoteIconStoreName, {
        url: props.url,
        data: blob,
        createdAt: Date.now(),
      });

      return blob;
    },
    {
      queryKey: ['icon', { url: props.url }],
    },
  );

  createEffect(() => {
    if (icon.data instanceof Blob) {
      const blobUrl = URL.createObjectURL(icon.data);
      setBlobUrl(blobUrl);

      onCleanup(() => {
        URL.revokeObjectURL(blobUrl);
      });
    }
  });

  return (
    <Switch>
      <Match when={blobUrl()}>{(url) => <img src={url()} />}</Match>
      <Match when={icon.data?.type === RouteTypes.Note}>
        <Icon {...(icon.data as Icon)} />
      </Match>
      <Match when={icon.data?.type === RouteTypes.Memo}>
        <LightbulbIcon />
      </Match>
      <Match when={icon.data?.type === RouteTypes.Annotation}>
        <MessageSquareIcon />
      </Match>
      <Match when={icon.data?.type === RouteTypes.File}>
        <FileIcon />
      </Match>
    </Switch>
  );
}
