import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { when } from 'mobx';

import { setupLinkIcon } from './icon';
import { setupLinkJump } from './jump';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');
    const abortController = new AbortController();
    const { entity, dispose: disposeJump } = setupLinkJump(dom, ctx, mark);

    let disposeIcon: (() => void) | undefined;

    when(
      () => entity.isSuccess,
      () => {
        disposeIcon = setupLinkIcon(dom, entity.data);
      },
      { signal: abortController.signal },
    );

    abortController.signal.addEventListener('abort', () => {
      disposeIcon?.();
      disposeJump();
    });

    return {
      dom,
      destroy: () => {
        abortController.abort();
      },
    };
  };
});
