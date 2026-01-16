import { Plugin } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { debounce } from 'lodash-es';
import { render } from 'solid-js/web';
import { createComponent } from 'solid-js';

import View, { Mode } from './View';
import shell from '#web/infra/shell';

export default $prose((ctx) => {
  let dispose: (() => void) | undefined;
  let tooltipRoot: HTMLElement | undefined;
  let mode: Mode | undefined;
  let targetDom: HTMLAnchorElement | undefined;

  function hide(forced = false) {
    if (mode === Mode.Edit && !forced) {
      return false;
    }

    dispose?.();
    tooltipRoot?.remove();
    tooltipRoot = undefined;
    dispose = undefined;
    targetDom = undefined;
    mode = undefined;
    return true;
  }

  const hideDelay = debounce(hide, 600);

  const show = (e: MouseEvent) => {
    hideDelay.cancel();

    if (targetDom === e.target) {
      return;
    }

    const hidden = hide();

    if (!hidden) {
      return;
    }

    targetDom = e.target as HTMLAnchorElement;
    tooltipRoot = document.createElement('div');
    dispose = render(
      () =>
        createComponent(View, {
          ctx,
          targetDom,
          mousePosition: { x: e.clientX, y: e.clientY },
          onModeChange: (v) => (mode = v),
          onLeave: hideDelay,
          onClose: hide.bind(null, true),
          onEnter: hideDelay.cancel,
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
