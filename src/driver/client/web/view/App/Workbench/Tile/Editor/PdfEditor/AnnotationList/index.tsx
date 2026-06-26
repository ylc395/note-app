import { createMemo, createSignal, For, Show } from 'solid-js';
import { LoaderCircleIcon, PinOffIcon } from 'lucide-solid';
import { useSplitterContext } from '@ark-ui/solid';
import { partialRight } from 'lodash-es';
import { cx } from 'class-variance-authority';
import { action } from 'mobx';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import FloatingPanel from '#web/view/components/FloatingPanel';
import Button from '#web/view/components/Button';
import panelStyles from '../../shared/panel.module.css';

import TextItem from './TextItem';
import Settings from './Settings';
import SvgItem from './SvgItem';
import { useContext } from '../context';

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
            panelStyles.shell,
            'overflow-auto text-fg-primary',
            uiState.isFloating ? 'border border-border-primary rounded-lg shadow-lg' : 'border-l border-border-primary',
          )}
          {...injected()}
          {...(uiState.isFloating ? null : splitter().getPanelProps({ id: props.id }))}
        >
          <div class="sticky top-0 z-10 flex items-center justify-between px-3 py-2.5 bg-surface-raised border-b border-border-secondary">
            <FloatingPanel.Handler
              asChild={(props) => (
                <div {...props()} class="flex-1 flex items-center gap-2 min-w-0">
                  <Show when={items()}>
                    {(items) => (
                      <span class="text-sm font-medium text-fg-secondary truncate">共计 {items().length} 个标注</span>
                    )}
                  </Show>
                </div>
              )}
            />
            <div class="flex items-center gap-1 shrink-0">
              <Settings />
              <Show when={uiState.isFloating}>
                <Button size="small" onClick={action(cancelFloating)} class="text-fg-secondary hover:text-fg-primary">
                  <PinOffIcon class="size-4" />
                </Button>
              </Show>
            </div>
          </div>
          <div class="flex-1 p-2 overflow-auto">
            <Show
              when={viewer.viewer.isReady && items()}
              fallback={
                <div class={cx(panelStyles.loading, 'flex-col gap-3 text-fg-tertiary')}>
                  <LoaderCircleIcon class="animate-spin size-6" />
                  <span class="text-sm">加载中</span>
                </div>
              }
            >
              {(items) => (
                <div class="flex flex-col gap-2">
                  <For
                    each={items()}
                    fallback={
                      <div class="flex items-center justify-center py-12 text-sm text-fg-tertiary">暂无标注</div>
                    }
                  >
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
        </div>
      )}
    />
  );
}
