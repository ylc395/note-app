import dayjs from 'dayjs';
import { createMemo, Show } from 'solid-js';
import { MoreHorizontalIcon } from 'lucide-solid';
import {
  type AnnotationItem,
  default as AnnotationList,
} from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';

export default function Item(props: { value: AnnotationItem }) {
  const page = createMemo(() => {
    const { selector } = props.value;

    if (selector.type === 'PDFRectSelector') {
      return selector.page;
    }

    if (selector.type === 'PDFTextFragmentSelector') {
      return AnnotationList.getPage(selector, 'start');
    }
  });

  const quote = createMemo(() => {
    if (props.value.selector.type === 'PDFTextFragmentSelector') {
      return props.value.selector.fullText;
    }
  });

  return (
    <div class="border p-2">
      <div class="flex text-sm justify-between items-center">
        <Show when={typeof page() === 'number'}>
          <span>第{page()}页</span>
        </Show>
        <Show fallback={<span class="border px-1">内置</span>} when={!props.value.isNative}>
          <button>
            <MoreHorizontalIcon />
          </button>
        </Show>
      </div>
      <Show when={quote()}>
        <blockquote class="bg-gray-200 opacity-60">{quote()}</blockquote>
      </Show>
      <div class="my-2">{props.value.body}</div>
      <div class="text-sm text-right">
        <time>创建于 {dayjs(props.value.createdAt).format('YYYY年MM月DD日 HH:mm:ss')}</time>
      </div>
    </div>
  );
}
