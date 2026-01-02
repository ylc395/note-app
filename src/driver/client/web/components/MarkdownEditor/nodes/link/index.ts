import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { sanitizeUrl } from '@braintree/sanitize-url';

import { addIcon } from './icon';
import tooltipPlugin from './tooltip';
import './style.css';

export const linkNodeView = $view(linkSchema.mark, () => {
  return (mark): MarkView => {
    const dom = document.createElement('a');

    dom.dataset.linkIcon = 'true';
    dom.href = sanitizeUrl(mark.attrs.href);

    const disposeIcon = addIcon(dom);

    return {
      dom,
      destroy: () => {
        disposeIcon();
        dom.remove();
      },
    };
  };
});

export default [linkNodeView, tooltipPlugin].flat();
