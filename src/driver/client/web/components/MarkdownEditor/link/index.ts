import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { render, createComponent } from 'solid-js/web';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { debounce } from 'lodash-es';
import assert from 'assert';

import shell from '#web/infra/shell';
import Tooltip, { Mode } from './Tooltip';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');
    let dispose: (() => void) | undefined;
    let stopAutoUpdate: (() => void) | undefined;
    let mode: Mode | undefined;

    const delayHideTooltip = debounce(hideTooltip.bind(null, false), 600);

    dom.href = sanitizeUrl(mark.attrs.href);
    dom.addEventListener('mouseenter', showTooltip);
    dom.addEventListener('mouseleave', delayHideTooltip);

    function showTooltip(e?: MouseEvent) {
      delayHideTooltip.cancel();

      if (dispose) {
        return;
      }

      assert(e);
      const container = document.createDocumentFragment();

      dispose = render(
        () =>
          createComponent(Tooltip, {
            ctx,
            targetDom: dom,
            mousePosition: { x: e.clientX, y: e.clientY },
            close: hideTooltip.bind(null, true),
            onLeave: delayHideTooltip,
            onEnter: showTooltip,
            onModeChange: (v) => {
              mode = v;
            },
          }),
        container,
      );

      shell.appRoot.append(container);
    }

    function hideTooltip(destroy: boolean) {
      if (!destroy && mode === Mode.Edit) {
        return;
      }

      dispose?.();
      stopAutoUpdate?.();

      dispose = undefined;
      stopAutoUpdate = undefined;
    }

    return {
      dom,
      destroy: () => {
        hideTooltip(true);
        delayHideTooltip.cancel();
        dom.remove();
      },
    };
  };
});

export default linkNodeView;
