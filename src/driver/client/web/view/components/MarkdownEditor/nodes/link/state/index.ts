import { autorun } from 'mobx';

import Entity from '#domain/client/app/model/base/Entity';
import './style.css';

const DATASET_KEY = 'linkState';

enum LinkState {
  Invalid = 'invalid',
}

export function setupLinkState(dom: HTMLAnchorElement, entity?: Entity | null) {
  const abortController = new AbortController();

  if (entity) {
    autorun(
      () => {
        if (entity.value.isError) {
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
