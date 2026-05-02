import { Plugin } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { debounce } from 'lodash-es';
import { render } from 'solid-js/web';
import { createComponent } from 'solid-js';

import shell from '#web/infra/shell';
import LinkTooltip, { Mode } from './LinkTooltip';

export default $prose((ctx) => {
  let dispose: (() => void) | undefined;
  let tooltipRoot: HTMLElement | undefined;
  let isTooltipFixed = false;
  let targetDom: HTMLAnchorElement | undefined;
  let tooltipMode: Mode | undefined;

  function hide(forced: boolean) {
    if ((isTooltipFixed || tooltipMode === Mode.Edit || tooltipMode === Mode.Add) && !forced) {
      return false;
    }

    dispose?.();
    tooltipRoot?.remove();
    tooltipRoot = undefined;
    dispose = undefined;
    targetDom = undefined;
    isTooltipFixed = false;
    tooltipMode = undefined;
    return true;
  }

  const hideDelay = debounce(hide.bind(null, false), 600);

  const show = (e: MouseEvent) => {
    hideDelay.cancel();

    if (targetDom === e.target) {
      return;
    }

    const hidden = hide(false);

    if (!hidden) {
      return;
    }

    targetDom = e.target as HTMLAnchorElement;
    tooltipRoot = document.createElement('div');

    dispose = render(
      () =>
        createComponent(LinkTooltip, {
          initialUrl: targetDom?.href,
          onClose: hide.bind(null, true),
          onMouseLeave: hideDelay,
          onMouseEnter: hideDelay.cancel,
          targetDom,
          ctx,
          mousePosition: { x: e.clientX, y: e.clientY },
          onModeChange: (mode) => (tooltipMode = mode),
          onFixedChange: (isFixed: boolean) => (isTooltipFixed = isFixed),
        }),
      tooltipRoot,
    );
    shell.appRoot.append(tooltipRoot);
  };

  return new Plugin({
    props: {
      handleDOMEvents: {
        mouseout: (view, e) => {
          if (e.target instanceof HTMLAnchorElement) {
            hideDelay();
          }
        },
        mouseover: (view, e) => {
          if (e.target instanceof HTMLAnchorElement) {
            show(e);
          }
        },
      },
    },
    view: () => ({ destroy: hide.bind(null, true) }),
  });
});
