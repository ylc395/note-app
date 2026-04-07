import { Show, createMemo, Switch, Match } from 'solid-js';
import clsx from 'clsx';
import { FileIcon } from 'lucide-solid';
import z from 'zod';
import { createQuery } from 'mobx-tanstack-query/preset';
import type { Ctx } from '@milkdown/kit/ctx';
import { editorViewCtx } from '@milkdown/kit/core';

import container from '#utils/singletonContainer';
import { token } from '#domain/client/shared/infra/rpc';
import { parseAppUrl } from '#domain/shared/infra/url';

import useResizable from './useResizable';
import FileCard from './FileCard';

interface Props {
  figure?: boolean;
  attrs: Record<string, unknown>;
  nodePos: number | undefined;
  ctx: Ctx;
}

const stripQuery = (url: string) => {
  if (!URL.canParse(url)) {
    return '';
  }

  const urlObj = new URL(url);
  urlObj.search = '';

  return urlObj.toString();
};

export default function MultimediaView(props: Props) {
  const remote = container.resolve(token);
  const editorView = props.ctx.get(editorViewCtx);

  const attrs = createMemo(() =>
    z
      .object({
        src: z.string().catch(''),
        title: z.string().optional().catch(undefined),
        alt: z.string().optional().catch(undefined),
      })
      .parse(props.attrs),
  );

  const parsedUrl = createMemo(() => parseAppUrl(attrs().src));
  const fileId = createMemo(() => parsedUrl()?.id);
  const mediaClassName = 'block w-full h-full';

  const initialSize = createMemo(() => ({
    width: Number(parsedUrl()?.query.get('width')) || undefined,
    height: Number(parsedUrl()?.query.get('height')) ?? undefined,
  }));

  const { handleMouseDown, setMediaRef, containerStyle, naturalSize } = useResizable({
    initialSize,
    onResized: ({ width, height }) => {
      const nodePos = props.nodePos;

      if (typeof nodePos === 'number') {
        const url = new URL(attrs().src);
        url.searchParams.set('width', String(width));
        url.searchParams.set('height', String(height));
        editorView.dispatch(editorView.state.tr.setNodeAttribute(nodePos, 'src', url.toString()));
      }
    },
  });

  const fileQuery = createQuery(({ queryKey: [_, { id }], signal }) => remote.file.queryOneById.query(id, { signal }), {
    queryKey: ['files', { id: fileId()! }] as const,
    options: () => ({
      enabled: Boolean(fileId()),
    }),
  });

  return (
    <>
      <div class={clsx('relative text-center', props.figure ? 'mx-auto' : 'inline-block')} style={containerStyle()}>
        <Switch fallback={<FileCard file={fileQuery.data!} />}>
          <Match when={fileQuery.isError}>
            <FileIcon />
            {fileId()?.slice(0, 6)}不存在
          </Match>
          <Match when={!fileQuery.data}>
            <FileIcon />
            {fileId()?.slice(0, 6)}加载中
          </Match>
          <Match when={fileQuery.data?.mimeType.startsWith('image')}>
            <img
              class={mediaClassName}
              ref={setMediaRef}
              src={stripQuery(attrs().src)}
              alt={attrs().alt}
              title={attrs().title}
            />
          </Match>
          <Match when={fileQuery.data?.mimeType.startsWith('video')}>
            <video
              class={mediaClassName}
              ref={setMediaRef}
              src={stripQuery(attrs().src)}
              controls
              title={attrs().title}
            />
          </Match>
        </Switch>
        <Show when={naturalSize() && editorView.editable}>
          <div
            class="absolute w-3 h-3 -top-1.5 -left-1.5 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-500 transition-colors z-10"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            class="absolute w-3 h-3 -top-1.5 -right-1.5 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-500 transition-colors z-10"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            class="absolute w-3 h-3 -bottom-1.5 -left-1.5 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-500 transition-colors z-10"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            class="absolute w-3 h-3 -bottom-1.5 -right-1.5 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-500 transition-colors z-10"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />
        </Show>
      </div>
      <Show when={props.figure && attrs().title}>
        <caption>{attrs().title}</caption>
      </Show>
    </>
  );
}
