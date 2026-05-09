import { autorun } from 'mobx';

import type { EntitySource } from '#domain/client/app/model/base/entitySource';
import './style.css';

const DATASET_KEY = 'linkState';

enum LinkState {
  Invalid = 'invalid',
}

export function setupLinkState(dom: HTMLAnchorElement, entitySource?: EntitySource | null) {
  const abortController = new AbortController();

  if (entitySource) {
    autorun(
      () => {
        if (entitySource.value.isError) {
          dom.dataset[DATASET_KEY] = LinkState.Invalid;
        } else {
          delete dom.dataset[DATASET_KEY];
        }
      },
      { signal: abortController.signal },
    );
  }

  return () => {
    abortController.abort();
  };
}
