import { createEffect, createSignal, onCleanup, type Accessor, type JSX } from 'solid-js';
import { Ref } from '@solid-primitives/refs';
import { createContextProvider } from '@solid-primitives/context';
import { findAncestor } from '#web/utils/dom';

const containerMap = new WeakMap<HTMLElement, Set<HTMLElement>>();

const [ContextProvider, useContext] = createContextProvider(
  (props: {
    isEnabled: boolean;
    onMoveEnd: (e: { x: number; y: number }) => void;
    onMove: (e: { x: number; y: number }) => void;
    panelRef: Accessor<HTMLElement | undefined>;
  }) => ({
    isEnabled: () => props.isEnabled,
    onMoveEnd: props.onMoveEnd,
    onMove: props.onMove,
    panelRef: props.panelRef,
  }),
);

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

function Main(props: {
  children: JSX.Element;
  isEnabled: boolean;
  pos: { x?: number; y?: number; left?: number; top?: number; right?: number; bottom?: number };
  onMove: (e: { x: number; y: number }) => void;
  onMoveEnd: (e: { x: number; y: number }) => void;
}) {
  const [ref, setRef] = createSignal<HTMLElement>();

  createEffect(() => {
    const panel = ref();

    if (!props.isEnabled || !panel) {
      return;
    }

    if (typeof props.pos.left === 'number' || typeof props.pos.x === 'number') {
      panel.style.left = `${props.pos.left ?? props.pos.x}px`;
    }

    if (typeof props.pos.top === 'number' || typeof props.pos.y === 'number') {
      panel.style.top = `${props.pos.top ?? props.pos.y}px`;
    }

    if (typeof props.pos.right === 'number') {
      panel.style.right = `${props.pos.right}px`;
    }

    if (typeof props.pos.bottom === 'number') {
      panel.style.bottom = `${props.pos.bottom}px`;
    }

    onCleanup(() => {
      panel.style.top = '';
      panel.style.left = '';
      panel.style.right = '';
      panel.style.bottom = '';
    });
  });

  createEffect(() => {
    const panel = ref();

    if (!props.isEnabled || !panel) {
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

  return (
    <ContextProvider {...props} panelRef={ref}>
      <Ref ref={setRef}>{props.children}</Ref>
    </ContextProvider>
  );
}

function Handler(props: { children: JSX.Element }) {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let isDragging = false;
  const [handlerRef, setHandlerRef] = createSignal<HTMLElement>();
  const { panelRef, isEnabled, onMoveEnd, onMove } = useContext()!;

  createEffect(() => {
    const handler = handlerRef();
    const panel = panelRef();

    if (!handler || !panel || !isEnabled()) {
      return;
    }

    const abortController = new AbortController();

    handler.addEventListener(
      'pointerdown',
      (e) => {
        const maxZIndex = getMaxZIndex(panel);
        const zIndex = Number(getComputedStyle(panel).zIndex);

        if (Number.isNaN(zIndex) || zIndex < maxZIndex) {
          panel.style.zIndex = `${maxZIndex + 1}`;
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

        onMove({ x: startLeft + deltaX, y: startTop + deltaY });
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

        onMoveEnd({ x: parseFloat(panel.style.left), y: parseFloat(panel.style.top) });
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

  return <Ref ref={setHandlerRef}>{props.children}</Ref>;
}

export default { Main, Handler };
