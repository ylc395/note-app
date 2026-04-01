import { createMemo, createSignal, For, Show } from 'solid-js';
import { EyeIcon, LoaderCircleIcon } from 'lucide-solid';
import { useSplitterContext } from '@ark-ui/solid';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import TextItem from './TextItem';
import Settings from './Settings';
import SvgItem from './SvgItem';
import { useContext } from '../context';
import FloatingPanel from '#web/components/FloatingPanel';
import { action } from 'mobx';
import Resizable from '#web/components/Resizable';

export default function AnnotationList(props: { id: string }) {
  const splitter = useSplitterContext();
  const {
    viewer: { editor },
  } = useContext()!;

  const uiState = editor.annotation.uiState;
  const [floatingSize, setFloatingSize] = createSignal(uiState.floatingSize || { width: 300, height: 500 });
  const [floatingPos, setFloatingPos] = createSignal(uiState.floatingPos || { right: 20, top: 20 });

  const items = createMemo(() => {
    const annotations = editor.annotation.items.result.data;

    if (!annotations) {
      return;
    }

    const result: Array<AnnotationVO | AnnotationVO[]> = [];
    const arrayMap: Record<number, AnnotationVO[]> = {};

    for (const annotation of annotations) {
      if (annotation.selector.type === 'PDFTextPositionSelector') {
        result.push(annotation);
      }

      if (annotation.selector.type === 'PDFSvgSelector') {
        if (arrayMap[annotation.selector.page]) {
          arrayMap[annotation.selector.page]!.push(annotation);
        } else {
          result.push((arrayMap[annotation.selector.page] = [annotation]));
        }
      }
    }

    return result;
  });

  function handleMoveEnd(e: { x: number; y: number }) {
    uiState.floatingPos = e;
  }

  function handleResizeEnd(e: { width: number; height: number }) {
    uiState.floatingSize = e;
  }

  function toggleFloating() {
    uiState.isFloating = !uiState.isFloating;
  }

  return (
    <FloatingPanel.Main
      pos={floatingPos()}
      onMove={setFloatingPos}
      isEnabled={Boolean(editor.annotation.uiState.isFloating)}
      onMoveEnd={action(handleMoveEnd)}
    >
      <Resizable
        isEnabled={Boolean(editor.annotation.uiState.isFloating)}
        className="absolute"
        size={floatingSize()}
        onResize={setFloatingSize}
        onResizeEnd={action(handleResizeEnd)}
      >
        <div
          class="w-64 p-2 border-l flex flex-col overflow-auto"
          {...(editor.annotation.uiState.isFloating ? null : splitter().getPanelProps({ id: props.id }))}
        >
          <FloatingPanel.Handler>
            <div class="flex justify-between mb-2">
              <Show when={items()}>{(items) => <div class="text-sm">共计 {items().length} 个</div>}</Show>
              <div class="flex">
                <Settings />
                <button class="flex items-center text-sm" onClick={action(toggleFloating)}>
                  <EyeIcon class="mr-1" />
                  悬浮
                </button>
              </div>
            </div>
          </FloatingPanel.Handler>
          <Show
            when={items()}
            fallback={
              <div class="flex flex-col grow items-center justify-center">
                <LoaderCircleIcon class="animate-spin" /> 加载中
              </div>
            }
          >
            {(items) => (
              <div>
                <For each={items()} fallback={<div class="grow flex items-center justify-center">暂无标注</div>}>
                  {(item) => (
                    <Show when={Array.isArray(item)} fallback={<TextItem value={item as AnnotationVO} />}>
                      <SvgItem value={item as AnnotationVO[]} />
                    </Show>
                  )}
                </For>
              </div>
            )}
          </Show>
        </div>
      </Resizable>
    </FloatingPanel.Main>
  );
}
