import dayjs from 'dayjs';
import { Show } from 'solid-js';
import { MoreHorizontalIcon } from 'lucide-solid';

import type { PDFAnnotation } from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';

export default function Item(props: { value: PDFAnnotation }) {
  return (
    <div class="border p-2">
      <div class="flex text-sm justify-between items-center">
        <span>第{props.value.page}页</span>
        <Show fallback={<span class="border px-1">内置</span>} when={!props.value.isNative}>
          <button>
            <MoreHorizontalIcon />
          </button>
        </Show>
      </div>
      <div class="my-2">{props.value.content}</div>
      <div class="text-sm text-right">
        <time>创建于 {dayjs(props.value.createdAt).format('YYYY年MM月DD日 HH:mm:ss')}</time>
      </div>
    </div>
  );
}
