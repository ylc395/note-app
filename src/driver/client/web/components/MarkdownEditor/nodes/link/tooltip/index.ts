import { Plugin } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { debounce } from 'lodash-es';
import { render } from 'solid-js/web';
import { createComponent } from 'solid-js';

import shell from '#web/infra/shell';
import { parseAppUrl } from '#domain/shared/infra/url';
import ExternalLinkView, { Mode } from './ExternalLinkView';
import AppLinkView from './AppLinkView';

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
    const appUrl = parseAppUrl(targetDom.href);

    const props = {
      onLeave: hideDelay,
      onClose: hide.bind(null, true),
      onEnter: hideDelay.cancel,
      targetDom,
      ctx,
      mousePosition: { x: e.clientX, y: e.clientY },
    };

    if (appUrl) {
      dispose = render(() => createComponent(AppLinkView, { appUrl, ...props }), tooltipRoot);
    } else {
      dispose = render(
        () =>
          createComponent(ExternalLinkView, {
            onModeChange: (v) => (mode = v),
            ...props,
          }),
        tooltipRoot,
      );
    }

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
