import { createMemo, For, Show } from 'solid-js';
import { Loader2Icon } from 'lucide-solid';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import type PdfViewer from '../PDFViewer';
import TextItem from './TextItem';
import Settings from './Settings';
import SvgItem from './SvgItem';

export default function AnnotationList(props: { pdfViewer: PdfViewer }) {
  const items = createMemo(() => {
    const annotations = props.pdfViewer.editor.annotation.items.result.data;

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
    <div class="w-64 p-2 border-l flex flex-col overflow-auto">
      <div class="flex justify-between mb-2">
        <Show when={items()}>{(items) => <div class="text-sm">共计 {items().length} 个</div>}</Show>
        <Settings viewer={props.pdfViewer} />
      </div>
      <Show
        when={items()}
        fallback={
          <div class="flex flex-col grow items-center justify-center">
            <Loader2Icon class="animate-spin" /> 加载中
          </div>
        }
      >
        {(items) => (
          <div>
            <For each={items()} fallback={<div class="grow flex items-center justify-center">暂无标注</div>}>
              {(item) => (
                <Show
                  when={Array.isArray(item)}
                  fallback={<TextItem value={item as AnnotationVO} pdfViewer={props.pdfViewer} />}
                >
                  <SvgItem value={item as AnnotationVO[]} pdfViewer={props.pdfViewer} />
                </Show>
              )}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
}
