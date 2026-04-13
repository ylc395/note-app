import { createEffect, createSignal, onCleanup, type Accessor, type JSX } from 'solid-js';
import { Ref } from '@solid-primitives/refs';
import { createContextProvider } from '@solid-primitives/context';
import { findAncestor } from '#web/utils/dom';

const containerMap = new WeakMap<HTMLElement, Set<HTMLElement>>();

const [ContextProvider, useContext] = createContextProvider(
  (props: {
    isEnabled: boolean;
    onMoveEnd: (e: { x: number; y: number }) => void;
    onMoveStart: (e: { x: number; y: number }) => void;
    onMove: (e: { x: number; y: number }) => void;
    panelRef: Accessor<HTMLElement | undefined>;
  }) => ({
    isEnabled: () => props.isEnabled,
    onMoveEnd: props.onMoveEnd,
    onMoveStart: props.onMoveStart,
    onMove: props.onMove,
    panelRef: props.panelRef,
  }),
);

function getContainer(element: HTMLElement) {
  return findAncestor(element, (el) => getComputedStyle(el).position !== 'static');
}

function getMaxZIndex(element: HTMLElement | HTMLElement[]) {
  let siblings: Iterable<HTMLElement> | undefined;

  if (Array.isArray(element)) {
    if (element.length === 0) {
      return 0;
    }

    siblings = element;
  } else {
    const container = getContainer(element);

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
  onMoveStart: (e: { x: number; y: number }) => void;
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

    const container = getContainer(panel);

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
  const [handlerRef, setHandlerRef] = createSignal<HTMLElement>();
  const { panelRef, isEnabled, onMoveEnd, onMove, onMoveStart } = useContext()!;
  const [startPos, setStartPos] = createSignal<{
    mouse: { x: number; y: number };
    panel: { x: number; y: number };
  }>();

  // 开始拖动时，初始化 panel 的一些样式
  createEffect(() => {
    const panel = panelRef();
    const handler = handlerRef();

    if (isEnabled() && startPos() && panel && handler) {
      const maxZIndex = getMaxZIndex(panel);
      const zIndex = Number(getComputedStyle(panel).zIndex);

      if (Number.isNaN(zIndex) || zIndex < maxZIndex) {
        panel.style.zIndex = `${maxZIndex + 1}`;
      }
    }
  });

  createEffect(() => {
    const handler = handlerRef();
    const panel = panelRef();
    const startPosValue = startPos();

    if (!handler || !panel || !startPosValue) {
      return;
    }

    const container = getContainer(panel);

    if (!container) {
      return;
    }

    const abortController = new AbortController();
    const currentPos = { x: 0, y: 0 };

    document.addEventListener(
      'pointermove',
      (e) => {
        const deltaX = e.clientX - startPosValue.mouse.x;
        const deltaY = e.clientY - startPosValue.mouse.y;

        let newX = startPosValue.panel.x + deltaX;
        let newY = startPosValue.panel.y + deltaY;

        // 限制拖动范围不超过定位容器的边界
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const panelRect = panel.getBoundingClientRect();
          const maxX = containerRect.width - panelRect.width;
          const maxY = containerRect.height - panelRect.height;

          newX = Math.max(0, Math.min(maxX, newX));
          newY = Math.max(0, Math.min(maxY, newY));
        }

        currentPos.x = newX;
        currentPos.y = newY;

        if (isEnabled()) {
          onMove({ x: currentPos.x, y: currentPos.y });
        } else if (deltaX >= 3 || deltaY >= 3) {
          onMoveStart({ x: currentPos.x, y: currentPos.y });
        }
      },
      { signal: abortController.signal },
    );

    document.addEventListener(
      'pointerup',
      () => {
        if (!panel || !startPos) {
          return;
        }

        if (isEnabled()) {
          onMoveEnd({ x: currentPos.x, y: currentPos.y });
        }

        setStartPos(undefined);
        abortController.abort();
      },
      { signal: abortController.signal },
    );
  });

  createEffect(() => {
    const handler = handlerRef();
    const panel = panelRef();

    if (!handler || !panel) {
      return;
    }

    const abortController = new AbortController();

    handler.addEventListener(
      'pointerdown',
      (e) => {
        setStartPos({
          mouse: { x: e.clientX, y: e.clientY },
          panel: { x: panel.offsetLeft, y: panel.offsetTop },
        });
      },
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return <Ref ref={setHandlerRef}>{props.children}</Ref>;
}

export default { Main, Handler };
