import { onCleanup, untrack } from 'solid-js';
import type { Ctx } from '@milkdown/kit/ctx';

import { parseAppUrl, toEntityType } from '#domain/shared/infra/url';
import { editorModelCtx } from '#web/view/components/MarkdownEditor/editorModelCtx';
import { entityFactory } from '#domain/client/app/model/entityFactory';

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
          props.ctx?.get(editorModelCtx).jump?.({
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
