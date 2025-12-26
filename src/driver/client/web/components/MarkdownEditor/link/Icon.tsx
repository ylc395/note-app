import { useQuery } from '@tanstack/solid-query';
import z from 'zod';
import { createEffect, Match, onCleanup, Switch } from 'solid-js';

import container from '#utils/singletonContainer';
import { token as remoteToken } from '#domain/client/shared/infra/rpc';
import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';
import queryClient from '../shared/queryClient';
import Icon from '#web/components/common/Icon';
import { FileIcon, LightbulbIcon, MessageSquareIcon } from 'lucide-solid';
import { remoteIconStoreName } from '#domain/client/app/model/note/editor/BaseEditor';
import type { NoteVO } from '#domain/shared/model/note';

type Icon = Partial<Pick<NoteVO, 'icon' | 'mimeType'>> & { type: RouteTypes };

export default function LinkIcon(props: { url: string; container: HTMLElement }) {
  const remote = container.resolve(remoteToken);
  const db = container.resolve(documentDbToken);

  const icon = useQuery<Icon | Blob | null>(
    () => ({
      queryKey: ['icon', { url: props.url }],
      queryFn: async () => {
        const parsed = parseAppUrl(props.url);

        if (parsed) {
          if (parsed.type === RouteTypes.Note) {
            const note = await remote.note.queryOneById.query(parsed.id);
            return { type: RouteTypes.Note, icon: note.icon, mimeType: note.mimeType } as const;
          }

          return { type: parsed.type };
        }

        const localResult = await db.getByKey(
          remoteIconStoreName,
          props.url,
          z.object({ data: z.instanceof(Blob), createdAt: z.number() }),
        );

        if (localResult) {
          return localResult.data;
        }

        const result = await remote.file.queryIcon.query(props.url);

        if (!result) {
          return null;
        }

        const blob = new Blob([result as ArrayBuffer]);
        await db.put(remoteIconStoreName, {
          url: props.url,
          data: blob,
          createdAt: Date.now(),
        });

        return blob;
      },
    }),
    () => queryClient,
  );

  createEffect(() => {
    if (icon.data instanceof Blob) {
      const blobUrl = URL.createObjectURL(icon.data);
      // 试过直接用 <img /> 元素渲染，但是该元素会卡住光标，因此改用伪元素渲染
      props.container.style.setProperty('--icon-url', `url(${blobUrl})`);

      onCleanup(() => {
        URL.revokeObjectURL(blobUrl);
      });
    }
  });

  return (
    <Switch>
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
