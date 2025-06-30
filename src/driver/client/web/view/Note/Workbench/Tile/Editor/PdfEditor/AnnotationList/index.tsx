import { Show } from 'solid-js';
import { Loader2Icon } from 'lucide-solid';
import { Key } from '@solid-primitives/keyed';

import type PdfViewer from '../PDFViewer';
import Item from './Item';
import Settings from './Settings';

export default function AnnotationList(props: { pdfViewer: PdfViewer }) {
  return (
    <div class="w-64 p-2 border-l flex flex-col overflow-auto">
      <div class="flex justify-between mb-2">
        <Show when={props.pdfViewer.editor.annotation.items.result.data}>
          {(items) => <div class="text-sm">共计 {items().length} 个</div>}
        </Show>
        <Settings viewer={props.pdfViewer} />
      </div>
      <Show
        when={props.pdfViewer.editor.annotation.items.result.data}
        fallback={
          <div class="flex flex-col grow items-center justify-center">
            <Loader2Icon class="animate-spin" /> 加载中
          </div>
        }
      >
        {(items) => (
          <div>
            <Key each={items()} by="id" fallback={<div class="grow flex items-center justify-center">暂无标注</div>}>
              {(item) => <Item value={item()} pdfViewer={props.pdfViewer} />}
            </Key>
          </div>
        )}
      </Show>
    </div>
  );
}
