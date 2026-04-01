import { createEffect, createMemo, createSignal, For, onCleanup, Show, type JSX } from 'solid-js';
import { mergeRefs, Ref } from '@solid-primitives/refs';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeState {
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}

const directionCursors: Record<ResizeDirection, CSSStyleDeclaration['cursor']> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
};

function updateHandlePosition(direction: ResizeDirection, scrollbarWidth?: { vertical: number; horizontal: number }) {
  const style: JSX.CSSProperties = {};

  if (['ne', 'nw', 'se', 'sw'].includes(direction)) {
    style.width = '10px';
    style.height = '10px';
  } else {
    style.width = ['n', 's'].includes(direction) ? '100%' : '10px';
    style.height = ['w', 'e'].includes(direction) ? '100%' : '10px';
  }

  if (direction === 'ne') {
    style.right = '0px';
    style.top = '0px';
    style.transform = 'translate(100%, -100%)';
  }

  if (direction === 'nw') {
    style.left = '0px';
    style.top = '0px';
    style.transform = 'translate(-100%, -100%)';
  }

  if (direction === 'se') {
    style.right = '0px';
    style.bottom = '0px';
    style.transform = 'translate(100%, 100%)';
  }

  if (direction === 'sw') {
    style.left = '0px';
    style.bottom = '0px';
    style.transform = 'translate(-100%, 100%)';
  }

  if (direction === 'n') {
    style.left = '0px';
    style.top = '0px';
    style.transform = 'translateY(-50%)';
  }

  if (direction === 's') {
    style.left = '0px';
    style.bottom = '0px';
    style.transform = `translateY(calc(50% + ${scrollbarWidth?.horizontal ?? 0}px))`;
  }
  if (direction === 'w') {
    style.top = '0px';
    style.left = '0px';
    style.transform = `translateX(-50%)`;
  }

  if (direction === 'e') {
    style.top = '0px';
    style.right = '0px';
    style.transform = `translateX(calc(50% + ${scrollbarWidth?.vertical ?? 0}px))`;
  }

  return style;
}

export interface ResizableProps {
  children: JSX.Element;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  preserveAspectRatio?: boolean;
  className?: string;
  size: { width: number; height: number };
  onResize: (size: { width: number; height: number }) => void;
  onResizeEnd?: (size: { width: number; height: number }) => void;
  directions?: ResizeDirection[];
  isEnabled?: boolean;
  ref?: Ref<HTMLDivElement | undefined>;
}

export default function Resizable(props: ResizableProps) {
  const [scrollBarWidth, setScrollBarWidth] = createSignal<{ vertical: number; horizontal: number }>();

  let resizeState: ResizeState | null = null;
  const [targetRef, setTargetRef] = createSignal<HTMLDivElement>();
  const [childRef, setChildRef] = createSignal<HTMLElement>();
  const directions = createMemo(
    () => props.directions ?? (['e', 's', 'n', 'w', 'ne', 'nw', 'se', 'sw'] satisfies ResizeDirection[]),
  );

  function handlePointerDown(e: MouseEvent, direction: ResizeDirection) {
    const target = targetRef();

    if (!target) {
      return;
    }

    resizeState = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: target.offsetWidth,
      startHeight: target.offsetHeight,
      startLeft: target.offsetLeft,
      startTop: target.offsetTop,
    };
  }

  createEffect(() => {
    const child = childRef();

    if (!child) {
      return;
    }

    child.style.width = `${props.size.width}px`;
    child.style.height = `${props.size.height}px`;
  });

  createEffect(() => {
    const child = childRef();

    if (!child) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!child) {
        return;
      }

      const computedStyle = getComputedStyle(child);
      const hasVerticalScrollbar = child.scrollHeight > child.clientHeight;
      const hasHorizontalScrollbar = child.scrollWidth > child.clientWidth;

      setScrollBarWidth({
        vertical:
          hasVerticalScrollbar && computedStyle.overflowY !== 'hidden' ? child.offsetWidth - child.clientWidth : 0,

        horizontal:
          hasHorizontalScrollbar && computedStyle.overflowX !== 'hidden' ? child.offsetHeight - child.clientHeight : 0,
      });
    });

    resizeObserver.observe(child);

    onCleanup(() => {
      resizeObserver.disconnect();
    });
  });

  createEffect(() => {
    const abortController = new AbortController();

    document.addEventListener(
      'pointermove',
      (e) => {
        const target = targetRef();

        if (!resizeState || !target) {
          return;
        }

        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;

        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;

        // Calculate new dimensions based on direction
        if (resizeState.direction.includes('e')) {
          newWidth = resizeState.startWidth + deltaX;
        }
        if (resizeState.direction.includes('w')) {
          newWidth = resizeState.startWidth - deltaX;
        }
        if (resizeState.direction.includes('s')) {
          newHeight = resizeState.startHeight + deltaY;
        }
        if (resizeState.direction.includes('n')) {
          newHeight = resizeState.startHeight - deltaY;
        }

        // Apply aspect ratio constraint
        if (props.preserveAspectRatio) {
          const aspectRatio = resizeState.startWidth / resizeState.startHeight;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        // Apply min/max constraints
        newWidth = Math.max(props.minWidth ?? 50, newWidth);
        newHeight = Math.max(props.minHeight ?? 50, newHeight);

        if (props.maxWidth) {
          newWidth = Math.min(props.maxWidth, newWidth);
        }
        if (props.maxHeight) {
          newHeight = Math.min(props.maxHeight, newHeight);
        }

        props.onResize({ width: newWidth, height: newHeight });

        if (resizeState.direction.includes('w')) {
          const widthDiff = newWidth - resizeState.startWidth;
          target.style.left = `${resizeState.startLeft - widthDiff}px`;
        }
        if (resizeState.direction.includes('n')) {
          const heightDiff = newHeight - resizeState.startHeight;
          target.style.top = `${resizeState.startTop - heightDiff}px`;
        }
      },
      { signal: abortController.signal },
    );

    document.addEventListener(
      'pointerup',
      () => {
        if (!resizeState) {
          return;
        }

        props.onResizeEnd?.(props.size);

        resizeState = null;
      },
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return (
    <Show when={props.isEnabled} fallback={props.children}>
      <div ref={mergeRefs(setTargetRef, props.ref)} class={props.className}>
        <Ref ref={setChildRef}>{props.children}</Ref>
        <For each={directions()}>
          {(direction) => (
            <button
              style={{
                cursor: directionCursors[direction],
                ...updateHandlePosition(direction, scrollBarWidth()),
              }}
              class="absolute bg-transparent"
              data-resize-direction={direction}
              onPointerDown={(e) => handlePointerDown(e, direction)}
            />
          )}
        </For>
      </div>
    </Show>
  );
}
