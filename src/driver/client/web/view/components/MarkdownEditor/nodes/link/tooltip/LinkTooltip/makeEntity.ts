import { onCleanup, untrack } from 'solid-js';
import type { Ctx } from '@milkdown/kit/ctx';

import { parseAppUrl, toEntityType } from '#domain/shared/infra/url';
import { customCtx } from '#web/view/components/MarkdownEditor/customCtx';
import entityFactory from '#domain/client/app/model/entityFactory';

export default function makeEntity(props: { url: string; ctx?: Ctx }) {
  const appUrl = parseAppUrl(props.url);
  const entityType = appUrl && toEntityType(appUrl.type);
  const abortController = new AbortController();

  const entity = untrack(() => {
    return entityType && entityFactory(entityType, appUrl.id, abortController.signal);
  });

  const jump =
    appUrl && props.ctx
      ? () =>
          props.ctx?.get(customCtx).onJump?.({
            ...appUrl,
            mimeType: entity?.value.data?.mimeType,
          })
      : null;

  onCleanup(() => {
    abortController.abort();
  });

  return {
    entity,
    jump,
  };
}
