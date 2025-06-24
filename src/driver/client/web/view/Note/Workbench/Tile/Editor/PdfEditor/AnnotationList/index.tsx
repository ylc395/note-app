import { createMemo, For, Show } from 'solid-js';
import { Loader2Icon } from 'lucide-solid';

import type PdfViewer from '../PDFViewer';
import Item from './Item';
import Add from './Add';
import Settings from './Settings';

export default function AnnotationList(props: { pdfViewer: PdfViewer }) {
  const annotations = createMemo(() => {
    if (props.pdfViewer.editor.annotation.state.get('native') === false) {
      return props.pdfViewer.editor.annotation.list?.filter(({ isNative }) => !isNative);
    }

    return props.pdfViewer.editor.annotation.list;
  });

  return (
    <div class="w-64 p-2 border-l flex flex-col overflow-auto">
      <div class="flex justify-between mb-2">
        <Add />
        <Settings viewer={props.pdfViewer} />
      </div>
      <Show
        when={props.pdfViewer.editor.annotation.list}
        fallback={
          <div class="flex flex-col grow items-center justify-center">
            <Loader2Icon class="animate-spin" /> 加载中
          </div>
        }
      >
        <div>
          <For fallback={<div class="grow flex items-center justify-center">暂无标注</div>} each={annotations()}>
            {(item) => <Item value={item} pdfViewer={props.pdfViewer} />}
          </For>
        </div>
      </Show>
    </div>
  );
}
