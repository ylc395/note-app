import dayjs from 'dayjs';
import { createMemo, For, Show } from 'solid-js';
import { MoreHorizontalIcon } from 'lucide-solid';
import type { AnnotationItem } from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import { compact } from 'lodash-es';

export default function Item(props: { value: AnnotationItem }) {
  const page = createMemo(() =>
    props.value.selectors.reduce((page, selector) => {
      if (
        (selector.type === 'PDFRectSelector' || selector.type === 'PDFTextFragmentSelector') &&
        selector.page < page
      ) {
        return selector.page;
      }

      return page;
    }, Infinity),
  );

  const quotes = createMemo(() =>
    compact(
      props.value.selectors.map((s) => {
        if (s.type === 'PDFTextFragmentSelector') {
          return s.fullText;
        }
      }),
    ),
  );

  return (
    <div class="border p-2">
      <div class="flex text-sm justify-between items-center">
        <Show when={Number.isFinite(page())}>
          <span>第{page()}页</span>
        </Show>
        <Show fallback={<span class="border px-1">内置</span>} when={!props.value.isNative}>
          <button>
            <MoreHorizontalIcon />
          </button>
        </Show>
      </div>
      <Show when={quotes().length > 0}>
        <div>
          <For each={quotes()}>{(quote) => <blockquote>{quote}</blockquote>}</For>
        </div>
      </Show>
      <div class="my-2">{props.value.body}</div>
      <div class="text-sm text-right">
        <time>创建于 {dayjs(props.value.createdAt).format('YYYY年MM月DD日 HH:mm:ss')}</time>
      </div>
    </div>
  );
}
