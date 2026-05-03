import { createMemo, onCleanup, untrack } from 'solid-js';
import type { Ctx } from '@milkdown/kit/ctx';

import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import { customCtx } from '#web/view/components/MarkdownEditor/customCtx';
import NoteSource from '#domain/client/app/model/note/Source';

export default function useEntitySource(props: { url: string; ctx?: Ctx }) {
  const appUrl = parseAppUrl(props.url);
  const abortController = new AbortController();

  // todo: 当前我们只处理了 note
  const source = untrack(() =>
    appUrl?.type === RouteTypes.Note ? new NoteSource(appUrl.id, { signal: abortController.signal }) : null,
  );

  const mimeType = createMemo(() => source?.value.data?.mimeType);

  const jump =
    appUrl && props.ctx
      ? () =>
          props.ctx?.get(customCtx).onJump?.({
            ...appUrl,
            mimeType: mimeType(),
          })
      : null;

  onCleanup(() => {
    abortController.abort();
  });

  return {
    entitySource: source,
    mimeType,
    jump,
  };
}
