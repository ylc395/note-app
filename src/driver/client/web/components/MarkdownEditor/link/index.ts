import { $command, $view } from '@milkdown/kit/utils';
import { linkSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkView } from '@milkdown/kit/prose/view';
import { render, createComponent } from 'solid-js/web';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { debounce } from 'lodash-es';

import shell from '#web/infra/shell';
import View, { Mode } from './View';
import TooltipManager from '../shared/TooltipManager';

export const createLinkCommand = $command('createLink', () => () => () => false);

export const linkNodeView = $view(linkSchema.mark, (ctx) => {
  return (mark): MarkView => {
    const dom = document.createElement('a');
    let dispose: (() => void) | undefined;
    let container: HTMLElement | undefined;
    let isTooltipHover = false;
    let mode: Mode | undefined;
    const debouncedDestroy = debounce(() => destroyTooltip(), 600);
    const tooltipManager = ctx.get(TooltipManager.slice);

    dom.href = sanitizeUrl(mark.attrs.href);

    function renderTooltip(e: MouseEvent) {
      debouncedDestroy.cancel();

      if (container) {
        return;
      }

      container = document.createElement('div');
      container.addEventListener('mouseenter', () => {
        isTooltipHover = true;
      });

      function tryToDestroy() {
        if (mode !== Mode.Edit) {
          isTooltipHover = false;
        }
        debouncedDestroy();
      }

      container.addEventListener('mouseleave', tryToDestroy);
      container.addEventListener('focusout', tryToDestroy);

      shell.appRoot.append(container);
      dispose = render(
        () =>
          createComponent(View, {
            ctx,
            targetDom: dom,
            initialHref: dom.href,
            mousePosition: { x: e.clientX, y: e.clientY },
            onModeChange: (v) => (mode = v),
            onUpdate: destroyTooltip.bind(null, true),
          }),
        container,
      );

      tooltipManager.add(dom);
    }

    function destroyTooltip(force = false) {
      if (
        !force &&
        (isTooltipHover ||
          (document.activeElement &&
            container &&
            container.compareDocumentPosition(document.activeElement) & Node.DOCUMENT_POSITION_CONTAINED_BY))
      ) {
        return;
      }

      tooltipManager.delete(dom);
      dispose?.();
      container?.remove();

      dispose = undefined;
      container = undefined;

      if (force) {
        debouncedDestroy.cancel();
      }
    }

    dom.addEventListener('mouseenter', renderTooltip);
    dom.addEventListener('mouseleave', debouncedDestroy);

    return {
      dom,
      destroy: () => {
        destroyTooltip();
        dom.remove();
      },
    };
  };
});

export default [linkNodeView, createLinkCommand].flat();
