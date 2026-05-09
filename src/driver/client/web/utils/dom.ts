import type { JSX } from 'solid-js';
import { createComponent, render } from 'solid-js/web';
import shell from '#web/infra/shell';

export function isFullyVisible(dom: HTMLElement) {
  if (!dom.parentElement) {
    return false;
  }

  const parentRect = dom.parentElement.getBoundingClientRect();
  const domRect = dom.getBoundingClientRect();

  return (
    domRect.left >= parentRect.left &&
    domRect.right <= parentRect.right &&
    domRect.top >= parentRect.top &&
    domRect.bottom <= parentRect.bottom
  );
}

export function renderSolidApp<T>(component: (props: T) => JSX.Element, props: (params: { destroy: () => void }) => T) {
  const container = document.createElement('div');
  const dispose = render(() => createComponent(component, props({ destroy })), container);

  shell.appRoot.append(container);

  function destroy() {
    dispose();
    container.remove();
  }
}
