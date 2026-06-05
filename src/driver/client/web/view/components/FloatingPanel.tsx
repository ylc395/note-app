import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  Show,
  useContext,
  type Accessor,
  type JSX,
  type ParentProps,
  type Setter,
} from 'solid-js';
import { FloatingPanel } from '@ark-ui/solid/floating-panel';
import assert from 'assert';
import { clamp } from 'lodash-es';

const FloatingPanelContext = createContext<{
  isEnabled: Accessor<boolean>;
  isTempDragging: Accessor<boolean>;
  setIsTempDragging: Setter<boolean>;
  onMoveStart: (e: { x: number; y: number }) => void;
  onMove: (e: { x: number; y: number }) => void;
  onMoveEnd: (e: { x: number; y: number }) => void;
  panelRef: Accessor<HTMLElement | undefined>;
  boundaryEl?: Accessor<HTMLElement | null>;
}>();

/**
 * 非浮动状态下的拖动检测：检测 pointer 拖动超过阈值时触发 onMoveStart，
 * 并在同一个拖动周期（isTempDragging）内继续处理 onMove 和 onMoveEnd，
 * 这样切换到浮动模式后用户无需松开鼠标即可继续拖动。
 */
function DragDetector(props: { asChild: (props: () => JSX.HTMLAttributes<unknown>) => JSX.Element }) {
  const ctx = useContext(FloatingPanelContext);
  const abortController = new AbortController();

  function onPointerDown(e: PointerEvent) {
    assert(ctx);

    const startX = e.clientX;
    const startY = e.clientY;
    const panel = ctx.panelRef();
    assert(panel);

    // 计算面板相对于 boundaryEl 的初始位置
    const boundaryEl = ctx.boundaryEl?.() ?? document.body;
    const panelRect = panel.getBoundingClientRect();
    const boundaryRect = boundaryEl.getBoundingClientRect();

    const panelStartPos = {
      x: panelRect.left - (boundaryRect?.left ?? 0),
      y: panelRect.top - (boundaryRect?.top ?? 0),
    };

    const moveSignal = new AbortController();
    let panelCurrentPos: { x: number; y: number } | undefined;

    document.addEventListener(
      'pointermove',
      (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const panelRect = panel.getBoundingClientRect();

        console.log(boundaryRect, panelRect);

        panelCurrentPos = {
          x: clamp(panelStartPos.x + deltaX, 0, boundaryRect.width - panelRect.width),
          y: clamp(panelStartPos.y + deltaY, 0, boundaryRect.height - panelRect.height),
        };

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
  }

  onCleanup(() => {
    abortController.abort();
  });

  return props.asChild(() => ({
    onPointerDown,
  }));
}

function Main(props: {
  asChild: (injected: () => { ref: (el: HTMLElement) => void; style: JSX.CSSProperties }) => JSX.Element;
  isEnabled: boolean;
  pos: { x?: number; y?: number; left?: number; top?: number; right?: number; bottom?: number };
  size?: { width: number; height: number };
  onMove: (e: { x: number; y: number }) => void;
  onMoveEnd: (e: { x: number; y: number }) => void;
  onMoveStart: (e: { x: number; y: number }) => void;
  onResize?: (e: { width: number; height: number }) => void;
  onResizeEnd?: (e: { width: number; height: number }) => void;
  boundaryEl?: Accessor<HTMLElement | null>;
}) {
  const [panelRef, setPanelRef] = createSignal<HTMLElement>();
  const [isTempDragging, setIsTempDragging] = createSignal(false);

  const position = createMemo(() => {
    const { x, y, left, top } = props.pos;
    return { x: left ?? x ?? 0, y: top ?? y ?? 0 };
  });

  const contextValue = {
    isEnabled: () => props.isEnabled,
    onMoveStart: props.onMoveStart,
    onMove: props.onMove,
    onMoveEnd: props.onMoveEnd,
    boundaryEl: props.boundaryEl,
    panelRef,
    isTempDragging,
    setIsTempDragging,
  };

  /**
   * 将 viewport 相对坐标转换为 boundaryEl 相对坐标
   */
  const toBoundaryRelative = (position: { x: number; y: number }) => {
    const el = panelRef();
    if (!el) return position;

    const boundaryRect = props.boundaryEl?.()?.getBoundingClientRect();

    return {
      x: position.x - (boundaryRect?.left ?? 0),
      y: position.y - (boundaryRect?.top ?? 0),
    };
  };

  /**
   * 将 boundaryEl 相对坐标转换为 viewport 相对坐标（ark-ui 内部使用视口坐标）
   */
  const viewportPosition = createMemo(() => {
    const pos = position();
    const el = panelRef();

    if (!el) {
      return pos;
    }

    const boundaryEl = props.boundaryEl?.();

    if (!boundaryEl) {
      return pos;
    }

    const boundaryRect = boundaryEl.getBoundingClientRect();

    return {
      x: pos.x + boundaryRect.left,
      y: pos.y + boundaryRect.top,
    };
  });

  const injectedStyle = createMemo<JSX.CSSProperties>(() => {
    if (!isTempDragging()) return {};
    const pos = position();
    return {
      position: 'absolute',
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      'z-index': 10,
      ...(props.size && {
        width: `${props.size.width}px`,
        height: `${props.size.height}px`,
      }),
    };
  });

  const injectedProps = () => ({
    ref: setPanelRef,
    style: injectedStyle(),
  });

  return (
    <FloatingPanelContext.Provider value={contextValue}>
      <Show when={props.isEnabled && !isTempDragging()} fallback={props.asChild(injectedProps)}>
        <FloatingPanel.Root
          ref={setPanelRef}
          open={true}
          position={viewportPosition()}
          allowOverflow={false}
          getBoundaryEl={props.boundaryEl}
          onPositionChange={(e) => props.onMove(toBoundaryRelative(e.position))}
          onPositionChangeEnd={(e) => props.onMoveEnd(toBoundaryRelative(e.position))}
          size={props.size}
          onSizeChange={(e) => props.onResize?.(e.size)}
          onSizeChangeEnd={(e) => props.onResizeEnd?.(e.size)}
          draggable
          resizable
        >
          <FloatingPanel.Positioner class="z-10">
            <FloatingPanel.Content class="overflow-auto">
              {props.asChild(injectedProps)}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Handler(props: { asChild: (props: () => ParentProps<any>) => JSX.Element }) {
  const ctx = useContext(FloatingPanelContext);
  assert(ctx);

  return (
    <Show when={ctx.isEnabled() && !ctx.isTempDragging()} fallback={<DragDetector asChild={props.asChild} />}>
      <FloatingPanel.DragTrigger asChild={props.asChild} />
    </Show>
  );
}

export default { Main, Handler };
