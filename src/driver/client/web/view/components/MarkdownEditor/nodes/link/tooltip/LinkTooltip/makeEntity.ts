import { onCleanup, untrack } from 'solid-js';

import { parseAppUrl, toEntityType } from '#domain/shared/infra/url';
import { entityFactory } from '#domain/client/app/model/entityFactory';

export default function makeEntity(url: string) {
  const appUrl = parseAppUrl(url);
  const entityType = appUrl && toEntityType(appUrl.type);
  const abortController = new AbortController();

  const entity = untrack(() => {
    return entityType && entityFactory(entityType, appUrl.id, abortController.signal);
  });

  onCleanup(() => {
    abortController.abort();
  });

  return entity;
}
