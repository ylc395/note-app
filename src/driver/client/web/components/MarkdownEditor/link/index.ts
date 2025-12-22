import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { render, createComponent } from 'solid-js/web';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { debounce } from 'lodash-es';

import shell from '#web/infra/shell';
import View from './View';
import assert from 'assert';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');
    let dispose: (() => void) | undefined;
    let stopAutoUpdate: (() => void) | undefined;
    let container: DocumentFragment | undefined;

    const delayHideTooltip = debounce(hideTooltip, 600);

    dom.href = sanitizeUrl(mark.attrs.href);
    dom.addEventListener('mouseenter', showTooltip);
    dom.addEventListener('mouseleave', delayHideTooltip);

    function showTooltip(e?: MouseEvent) {
      delayHideTooltip.cancel();

      if (container) {
        return;
      }

      assert(e);
      container = document.createDocumentFragment();
      shell.appRoot.append(container);

      dispose = render(
        () =>
          createComponent(View, {
            ctx,
            targetDom: dom,
            mousePosition: { x: e.clientX, y: e.clientY },
            close: hideTooltip,
            onLeave: delayHideTooltip,
            onEnter: showTooltip,
          }),
        container,
      );
    }

    function hideTooltip() {
      dispose?.();
      stopAutoUpdate?.();

      container = undefined;
      dispose = undefined;
      stopAutoUpdate = undefined;
    }

    return {
      dom,
      destroy: () => {
        hideTooltip();
        delayHideTooltip.cancel();
        dom.remove();
      },
    };
  };
});

export default linkNodeView;
