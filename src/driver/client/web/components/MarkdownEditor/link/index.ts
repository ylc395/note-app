import { $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { render, createComponent } from 'solid-js/web';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { debounce } from 'lodash-es';
import assert from 'assert';

import shell from '#web/infra/shell';
import Tooltip, { Mode } from './Tooltip';
import Icon from './Icon';

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');
    const contentDOM = document.createElement('span');
    const iconContainer = document.createElement('span');
    iconContainer.dataset.linkIcon = 'true';
    iconContainer.contentEditable = 'false';

    dom.href = sanitizeUrl(mark.attrs.href);

    let disposeTooltip: (() => void) | undefined;
    let stopAutoUpdate: (() => void) | undefined;
    let mode: Mode | undefined;

    const disposeIcon = render(() => createComponent(Icon, { url: dom.href, container: iconContainer }), iconContainer);
    const delayHideTooltip = debounce(hideTooltip.bind(null, false), 600);

    dom.addEventListener('mouseenter', showTooltip);
    dom.addEventListener('mouseleave', delayHideTooltip);
    dom.append(iconContainer, contentDOM);

    function showTooltip(e?: MouseEvent) {
      delayHideTooltip.cancel();

      if (disposeTooltip) {
        return;
      }

      assert(e);
      const container = document.createDocumentFragment();

      disposeTooltip = render(
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

      disposeTooltip?.();
      stopAutoUpdate?.();

      disposeTooltip = undefined;
      stopAutoUpdate = undefined;
    }

    return {
      dom,
      contentDOM,
      destroy: () => {
        disposeIcon();
        hideTooltip(true);
        delayHideTooltip.cancel();
        dom.remove();
      },
    };
  };
});

export default linkNodeView;
