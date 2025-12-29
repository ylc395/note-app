import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { render, createComponent } from 'solid-js/web';
import { sanitizeUrl } from '@braintree/sanitize-url';

import Tooltip from './Tooltip';
import { addIcon } from './icon';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');

    dom.dataset.linkIcon = 'true';
    dom.href = sanitizeUrl(mark.attrs.href);

    const disposeIcon = addIcon(dom);

    const disposeTooltip = render(
      () => createComponent(Tooltip, { ctx, targetDom: dom }),
      document.createDocumentFragment(),
    );

    return {
      dom,
      destroy: () => {
        disposeIcon();
        disposeTooltip();
        dom.remove();
      },
    };
  };
});

export default linkNodeView;
