import { createMemo, For, Show } from 'solid-js';
import { LoaderCircleIcon } from 'lucide-solid';
import assert from 'assert';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import TextItem from './TextItem';
import Settings from './Settings';
import SvgItem from './SvgItem';
import { useContext } from '../../context';
import { useSplitterContext } from '@ark-ui/solid';

export default function AnnotationList(props: { id: string }) {
  const splitter = useSplitterContext();
  const ctx = useContext()!;
  const editor = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);
    return ctx.editor;
  });

  const items = createMemo(() => {
    const annotations = editor().annotation.items.result.data;

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

  return (
    <div
      class="w-64 p-2 border-l flex flex-col overflow-auto"
      {...(editor().annotation.uiState.isFloating ? null : splitter().getPanelProps({ id: props.id }))}
    >
      <div class="flex justify-between mb-2">
        <Show when={items()}>{(items) => <div class="text-sm">共计 {items().length} 个</div>}</Show>
        <Settings />
      </div>
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
  );
}
