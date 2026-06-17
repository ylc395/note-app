import dayjs from 'dayjs';
import { createMemo, Show } from 'solid-js';
import assert from 'assert';
import { first, last } from 'lodash-es';

import { getPageRange, type AnnotationVO, type PDFTextPositionSelector } from '#domain/client/app/model/annotation';
import { useContext } from '../context';

export default function TextItem(props: { value: AnnotationVO }) {
  const ctx = useContext()!;

  const pageRange = createMemo(() => getPageRange(props.value));
  const startPage = createMemo(() => first(pageRange()));
  const endPage = createMemo(() => last(pageRange()));
  const quote = createMemo(() => {
    assert(props.value.selector.type === 'PDFTextPositionSelector');
    return props.value.selector.fullText;
  });

  function jumpTo() {
    ctx.viewer.viewer.jumpTo((props.value.selector as PDFTextPositionSelector).position.startPage);
  }

  return (
    <div class="border border-border-primary bg-surface-raised rounded-md p-3 cursor-pointer" onClick={jumpTo}>
      <div class="flex text-sm items-center text-fg-secondary mb-1">
        <Show when={typeof startPage() === 'number'}>
          第{startPage()}页<Show when={endPage() && endPage() !== startPage()}>-第{endPage()}页</Show>
        </Show>
      </div>
      <Show when={quote()}>
        <blockquote
          onClick={(e) => e.stopPropagation()}
          class="bg-bg-tertiary text-fg-secondary text-xs p-2 rounded border-l-2 border-border-secondary truncate select-text cursor-text"
        >
          {quote()}
        </blockquote>
      </Show>
      <div class="my-2 text-fg-primary select-text cursor-text">{props.value.body}</div>
      <div class="text-xs text-right text-fg-tertiary">
        <time>创建于 {dayjs(props.value.createdAt).format('YYYY年MM月DD日 HH:mm:ss')}</time>
      </div>
    </div>
  );
}
