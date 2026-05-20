import dayjs from 'dayjs';
import { createMemo, Show } from 'solid-js';
import assert from 'assert';

import { getPageRange, type AnnotationVO } from '#domain/client/app/model/annotation';
import PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import { useContext } from '../../composables';
import { first, last } from 'lodash-es';

export default function TextItem(props: { value: AnnotationVO }) {
  const ctx = useContext()!;
  const editor = createMemo(() => {
    assert(ctx.editor instanceof PdfEditor);
    return ctx.editor;
  });

  const pageRange = createMemo(() => getPageRange(props.value));
  const startPage = createMemo(() => first(pageRange()));
  const endPage = createMemo(() => last(pageRange()));
  const quote = createMemo(() => {
    assert(props.value.selector.type === 'PDFTextPositionSelector');
    return props.value.selector.fullText;
  });

  function jumpTo() {
    editor();
  }

  return (
    <div class="border p-2" onClick={jumpTo}>
      <div class="flex text-sm items-center">
        <Show when={typeof startPage() === 'number'}>
          第{startPage()}页<Show when={endPage() && endPage() !== startPage()}>-第{endPage()}页</Show>
        </Show>
      </div>
      <Show when={quote()}>
        <blockquote class="bg-bg-tertiary opacity-60">{quote()}</blockquote>
      </Show>
      <div class="my-2">{props.value.body}</div>
      <div class="text-sm text-right">
        <time>创建于 {dayjs(props.value.createdAt).format('YYYY年MM月DD日 HH:mm:ss')}</time>
      </div>
    </div>
  );
}
