import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { render, createComponent } from 'solid-js/web';
import { sanitizeUrl } from '@braintree/sanitize-url';
import Tooltip from './Tooltip';
import Icon from './Icon';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');
    const contentDOM = document.createElement('span');
    const iconContainer = document.createDocumentFragment();

    dom.dataset.linkIcon = 'true';
    dom.href = sanitizeUrl(mark.attrs.href);
    dom.append(contentDOM);

    const disposeIcon = render(
      () => createComponent(Icon, { url: dom.href, linkDom: dom, onLoad: mountIcon }),
      iconContainer,
    );
    const disposeTooltip = render(() => createComponent(Tooltip, { ctx, targetDom: dom }), dom);

    function mountIcon() {
      dom.prepend(iconContainer);
    }

    return {
      dom,
      contentDOM,
      destroy: () => {
        disposeIcon();
        disposeTooltip();
        dom.remove();
      },
    };
  };
});

export default linkNodeView;
