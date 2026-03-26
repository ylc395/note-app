import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';
import { findAncestor } from '#web/infra/domUtils';

const containerMap = new WeakMap<HTMLElement, Set<HTMLElement>>();

function getMaxZIndex(element: HTMLElement | HTMLElement[]) {
  let siblings: Iterable<HTMLElement> | undefined;

  if (Array.isArray(element)) {
    if (element.length === 0) {
      return 0;
    }

    siblings = element;
  } else {
    const container = findAncestor(element, (el) => getComputedStyle(el).position !== 'static');

    if (!container) {
      return 0;
    }

    siblings = containerMap.get(container);
  }

  return siblings
    ? Math.max(
        ...Array.from(siblings).map((el) => {
          const zIndex = Number(getComputedStyle(el).zIndex);
          return Number.isNaN(zIndex) ? 0 : zIndex;
        }),
      )
    : 0;
}

export default function useFloatingPanel(params: {
  isEnabled: Accessor<boolean>;
  initialPos?: () => { x: number; y: number; width?: number } | undefined;
  onMoveEnd: (e: { x: number; y: number }) => void;
}) {
  const [panelRef, setPanelRef] = createSignal<HTMLElement>();
  const [handlerRef, setHandlerRef] = createSignal<HTMLElement>();

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let isDragging = false;
  const abortController = new AbortController();

  createEffect(() => {
    const panel = panelRef();

    if (!params.isEnabled() || !panel) {
      return;
    }

    if (params.initialPos?.()) {
      panel.style.left = `${params.initialPos()?.x}px`;
      panel.style.top = `${params.initialPos()?.y}px`;
      panel.style.width = `${params.initialPos()?.width}px`;

      onCleanup(() => {
        panel.style.top = '';
        panel.style.left = '';
        panel.style.width = '';
      });
    }
  });

  createEffect(() => {
    const panel = panelRef();

    if (!params.isEnabled() || !panel) {
      return;
    }

    const container = findAncestor(panel, (el) => getComputedStyle(el).position !== 'static');

    if (!container) {
      return;
    }

    let siblings = containerMap.get(container);

    if (!siblings) {
      siblings = new Set();
      containerMap.set(container, siblings);
    }

    const maxIndex = getMaxZIndex(Array.from(siblings));

    siblings.add(panel);
    panel.style.position = 'absolute';
    panel.style.zIndex = `${maxIndex + 1}`;
    panel.dataset.floatingPanel = 'true';

    onCleanup(() => {
      panel.style.position = '';
      panel.style.zIndex = '';
      delete panel.dataset.floatingPanel;
      containerMap.get(container)?.delete(panel);
    });
  });

  createEffect(() => {
    const handler = handlerRef();
    const panel = panelRef();

    if (!handler || !panel) {
      return;
    }

    handler.addEventListener(
      'pointerdown',
      (e) => {
        if (!params.isEnabled()) {
          return;
        }

        const maxZIndex = getMaxZIndex(panel);
        const zIndex = Number(getComputedStyle(panel).zIndex);

        if (Number.isNaN(zIndex) || zIndex < maxZIndex) {
          panel.style.zIndex = `${maxZIndex} + 1`;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        startLeft = panel.offsetLeft;
        startTop = panel.offsetTop;
        handler.style.cursor = 'grabbing';
      },
      { signal: abortController.signal },
    );

    document.addEventListener(
      'pointermove',
      (e) => {
        if (!isDragging) {
          return;
        }

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        panel.style.left = startLeft + deltaX + 'px';
        panel.style.top = startTop + deltaY + 'px';
        handler.setPointerCapture(e.pointerId);
      },
      { signal: abortController.signal },
    );

    document.addEventListener(
      'pointerup',
      (e) => {
        if (!panel || !isDragging) {
          return;
        }

        params.onMoveEnd({ x: parseFloat(panel.style.left), y: parseFloat(panel.style.top) });
        handler.style.cursor = '';
        isDragging = false;
        handler.releasePointerCapture(e.pointerId);
      },
      { signal: abortController.signal, capture: true },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return { setHandlerRef, setPanelRef };
}
