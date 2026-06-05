import { createMemo, createSignal, For, Show } from 'solid-js';
import { LoaderCircleIcon, PinOffIcon } from 'lucide-solid';
import { useSplitterContext } from '@ark-ui/solid';
import { partialRight } from 'lodash-es';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import TextItem from './TextItem';
import Settings from './Settings';
import SvgItem from './SvgItem';
import { useContext } from '../context';
import FloatingPanel from '#web/view/components/FloatingPanel';
import { action } from 'mobx';
import Button from '#web/view/components/Button';
import { cx } from 'class-variance-authority';

export default function AnnotationList(props: { id: string }) {
  const splitter = useSplitterContext();
  const { viewer } = useContext()!;
  const { editor } = viewer;

  const uiState = editor.annotation.uiState;
  const [floatingSize, setFloatingSize] = createSignal(uiState.floatingSize || { width: 300, height: 500 });
  const [floatingPos, setFloatingPos] = createSignal(uiState.floatingPos || { x: 20, y: 20 });

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

  function handleMove(pos: { x: number; y: number }, start?: boolean) {
    if (start) {
      uiState.isFloating = true;
    }
    setFloatingPos(pos);
  }

  function cancelFloating() {
    uiState.isFloating = false;
  }

  return (
    <FloatingPanel.Main
      pos={floatingPos()}
      onMoveStart={action(partialRight(handleMove, true))}
      onMove={action(handleMove)}
      isEnabled={Boolean(editor.annotation.uiState.isFloating)}
      onMoveEnd={action(handleMoveEnd)}
      boundaryEl={() => viewer.rootEl}
      size={floatingSize()}
      onResize={action(setFloatingSize)}
      onResizeEnd={action(handleResizeEnd)}
      asChild={(injected) => (
        <div
          class={cx(
            'p-2 border-border-primary flex flex-col bg-surface-raised overflow-auto relative h-full',
            uiState.isFloating ? 'border' : 'border-l',
          )}
          {...injected()}
          {...(uiState.isFloating ? null : splitter().getPanelProps({ id: props.id }))}
        >
          <FloatingPanel.Handler
            asChild={(props) => (
              <div {...props()} class="flex justify-between mb-2 sticky top-0">
                <Show when={items()}>{(items) => <div class="text-sm">共计 {items().length} 个</div>}</Show>
                <div class="flex">
                  <Settings />
                  <Show when={uiState.isFloating}>
                    <Button size="small" onClick={action(cancelFloating)}>
                      <PinOffIcon class="mr-1" />
                    </Button>
                  </Show>
                </div>
              </div>
            )}
          />
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
      )}
    />
  );
}
