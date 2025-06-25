import dayjs from 'dayjs';
import { createMemo, Show } from 'solid-js';
import { MoreHorizontalIcon } from 'lucide-solid';

import type { AnnotationVO } from '#domain/shared/model/annotation';
import PdfViewer from '../PDFViewer';

export default function Item(props: { value: AnnotationVO; pdfViewer: PdfViewer }) {
  const page = createMemo(() => {
    const { selector } = props.value;

    if (selector.type === 'PDFRectSelector') {
      return selector.page;
    }

    if (selector.type === 'PDFTextPositionSelector') {
      return selector.position.startPage;
    }
  });

  const quote = createMemo(() => {
    if (props.value.selector.type === 'PDFTextPositionSelector') {
      return props.value.selector.fullText;
    }
  });

  function jumpTo() {
    const _page = page();

    if (!_page) {
      return;
    }

    props.pdfViewer.jumpTo(_page, {
      onJump: ({ pageElement }) => {
        const markEl = pageElement.querySelector(`.${PdfViewer.getAnnotationMarkClassName(props.value.id)}`);
        markEl?.scrollIntoView({ block: 'center' });
      },
    });
  }

  return (
    <div class="border p-2" onClick={jumpTo}>
      <div class="flex text-sm justify-between items-center">
        <Show when={typeof page() === 'number'}>
          <span>第{page()}页</span>
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
