import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  Show,
  useContext,
  type Accessor,
  type JSX,
  type Setter,
} from 'solid-js';
import { Ref } from '@solid-primitives/refs';
import { FloatingPanel } from '@ark-ui/solid/floating-panel';
import assert from 'assert';

const FloatingPanelContext = createContext<{
  isEnabled: Accessor<boolean>;
  isTempDragging: Accessor<boolean>;
  setIsTempDragging: Setter<boolean>;
  onMoveStart: (e: { x: number; y: number }) => void;
  onMove: (e: { x: number; y: number }) => void;
  onMoveEnd: (e: { x: number; y: number }) => void;
  panelRef: Accessor<HTMLElement | undefined>;
}>();

/**
 * 非浮动状态下的拖动检测：检测 pointer 拖动超过阈值时触发 onMoveStart，
 * 并在同一个拖动周期（isTempDragging）内继续处理 onMove 和 onMoveEnd，
 * 这样切换到浮动模式后用户无需松开鼠标即可继续拖动。
 */
function DragDetector(props: { children: JSX.Element }) {
  const [handlerRef, setHandlerRef] = createSignal<HTMLElement>();
  const ctx = useContext(FloatingPanelContext);
  assert(ctx);

  createEffect(() => {
    const handler = handlerRef();

    if (!handler) {
      return;
    }

    handler.style.cursor = 'move';

    const abortController = new AbortController();

    handler.addEventListener(
      'pointerdown',
      (e) => {
        const startX = e.clientX;
        const startY = e.clientY;
        const panel = ctx.panelRef();
        assert(panel);

        const panelStartPos = {
          x: panel.offsetLeft,
          y: panel.offsetTop,
        };

        const moveSignal = new AbortController();
        let panelCurrentPos: { x: number; y: number } | undefined;

        document.addEventListener(
          'pointermove',
          (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            panelCurrentPos = { x: panelStartPos.x + deltaX, y: panelStartPos.y + deltaY };

            if (ctx.isTempDragging()) {
              ctx.onMove(panelCurrentPos);
            } else if (Math.abs(deltaX) >= 3 || Math.abs(deltaY) >= 3) {
              ctx.setIsTempDragging(true);
              ctx.onMoveStart(panelCurrentPos);
            }
          },
          { signal: AbortSignal.any([abortController.signal, moveSignal.signal]) },
        );

        document.addEventListener(
          'pointerup',
          () => {
            if (ctx.isTempDragging() && panelCurrentPos) {
              ctx.onMoveEnd(panelCurrentPos);
              ctx.setIsTempDragging(false);
            }

            moveSignal.abort();
          },

          { signal: AbortSignal.any([abortController.signal, moveSignal.signal]) },
        );
      },
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return <Ref ref={setHandlerRef}>{props.children}</Ref>;
}

function Main(props: {
  children: JSX.Element;
  isEnabled: boolean;
  pos: { x?: number; y?: number; left?: number; top?: number; right?: number; bottom?: number };
  size?: { width: number; height: number };
  onMove: (e: { x: number; y: number }) => void;
  onMoveEnd: (e: { x: number; y: number }) => void;
  onMoveStart: (e: { x: number; y: number }) => void;
  onResize?: (e: { width: number; height: number }) => void;
  onResizeEnd?: (e: { width: number; height: number }) => void;
}) {
  const position = createMemo(() => {
    const { x, y, left, top } = props.pos;
    return { x: left ?? x ?? 0, y: top ?? y ?? 0 };
  });

  const [panelRef, setPanelRef] = createSignal<HTMLElement>();
  const [isTempDragging, setIsTempDragging] = createSignal(false);

  const contextValue = {
    isEnabled: () => props.isEnabled,
    onMoveStart: props.onMoveStart,
    onMove: props.onMove,
    onMoveEnd: props.onMoveEnd,
    panelRef,
    isTempDragging,
    setIsTempDragging,
  };

  createEffect(() => {
    const panel = panelRef();
    if (isTempDragging() && panel) {
      Object.assign(panel.style, {
        position: 'absolute',
        left: `${position().x}px`,
        top: `${position().y}px`,
        zIndex: 10,
      });
    }
  });

  return (
    <FloatingPanelContext.Provider value={contextValue}>
      <Show when={props.isEnabled && !isTempDragging()} fallback={<Ref ref={setPanelRef}>{props.children}</Ref>}>
        <FloatingPanel.Root
          open={true}
          position={position()}
          onPositionChange={(e) => props.onMove(e.position)}
          onPositionChangeEnd={(e) => props.onMoveEnd(e.position)}
          size={props.size}
          onSizeChange={(e) => props.onResize?.(e.size)}
          onSizeChangeEnd={(e) => props.onResizeEnd?.(e.size)}
          strategy="absolute"
          draggable
          resizable
        >
          <FloatingPanel.Positioner class="z-10">
            <FloatingPanel.Content ref={setPanelRef}>
              {props.children}
              <FloatingPanel.ResizeTrigger axis="n" class="absolute top-0 left-2 right-2 h-1 cursor-n-resize" />
              <FloatingPanel.ResizeTrigger axis="e" class="absolute top-2 right-0 bottom-2 w-1 cursor-e-resize" />
              <FloatingPanel.ResizeTrigger axis="w" class="absolute top-2 left-0 bottom-2 w-1 cursor-w-resize" />
              <FloatingPanel.ResizeTrigger axis="s" class="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize" />
              <FloatingPanel.ResizeTrigger axis="ne" class="absolute top-0 right-0 h-2 w-2 cursor-ne-resize" />
              <FloatingPanel.ResizeTrigger axis="se" class="absolute bottom-0 right-0 h-2 w-2 cursor-se-resize" />
              <FloatingPanel.ResizeTrigger axis="sw" class="absolute bottom-0 left-0 h-2 w-2 cursor-sw-resize" />
              <FloatingPanel.ResizeTrigger axis="nw" class="absolute top-0 left-0 h-2 w-2 cursor-nw-resize" />
            </FloatingPanel.Content>
          </FloatingPanel.Positioner>
        </FloatingPanel.Root>
      </Show>
    </FloatingPanelContext.Provider>
  );
}

function Handler(props: { children: JSX.Element }) {
  const ctx = useContext(FloatingPanelContext);
  assert(ctx);

  return (
    <Show when={ctx.isEnabled() && !ctx.isTempDragging()} fallback={<DragDetector>{props.children}</DragDetector>}>
      <FloatingPanel.DragTrigger>{props.children}</FloatingPanel.DragTrigger>
    </Show>
  );
}

export default { Main, Handler };
