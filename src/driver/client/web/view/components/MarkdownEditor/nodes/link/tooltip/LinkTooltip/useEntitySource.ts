import { onCleanup, untrack } from 'solid-js';
import type { Ctx } from '@milkdown/kit/ctx';

import { parseAppUrl, toEntityType } from '#domain/shared/infra/url';
import { customCtx } from '#web/view/components/MarkdownEditor/customCtx';
import entitySourceFactory from '#domain/client/app/model/entitySourceFactory';

export default function useEntitySource(props: { url: string; ctx?: Ctx }) {
  const appUrl = parseAppUrl(props.url);
  const abortController = new AbortController();

  const source = untrack(() => {
    const entityType = appUrl && toEntityType(appUrl.type);
    return entityType && entitySourceFactory(entityType, appUrl.id, abortController.signal);
  });

  const jump =
    appUrl && props.ctx
      ? () =>
          props.ctx?.get(customCtx).onJump?.({
            ...appUrl,
            mimeType: source?.value.data?.mimeType,
          })
      : null;

  onCleanup(() => {
    abortController.abort();
  });

  return {
    entitySource: source,
    jump,
  };
}
