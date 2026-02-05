import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { addIcon } from './icon';
import { editorViewCtx } from '@milkdown/kit/core';
import { parseAppUrl } from '#domain/shared/infra/url';
import shell from '#web/infra/shell';
import { customCtx } from '../../customCtx';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');

    dom.dataset.linkIcon = 'true';
    dom.href = sanitizeUrl(mark.attrs.href);
    const disposeIcon = addIcon(dom);

    if (!ctx.get(editorViewCtx).editable) {
      const parsed = parseAppUrl(dom.href);

      dom.addEventListener('click', (e) => {
        e.preventDefault();

        if (parsed) {
          ctx.get(customCtx).onJump?.(parsed);
        } else {
          shell.openNewWindow(dom.href);
        }
      });

      if (!parsed) {
        dom.title = dom.href;
      }
    }

    return {
      dom,
      destroy: () => {
        disposeIcon();
        dom.remove();
      },
    };
  };
});
