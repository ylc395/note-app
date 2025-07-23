import assert from 'assert';
import { createMemo } from 'solid-js';
import dayjs from 'dayjs';
import type { AnnotationVO } from '#domain/shared/model/annotation';

import type PdfViewer from '../PDFViewer';
import { maxBy } from 'lodash-es';

export default function SvgItem(props: { pdfViewer: PdfViewer; value: AnnotationVO[] }) {
  const page = createMemo(() => {
    const annotation = props.value[0];
    assert(annotation?.selector.type === 'PDFSvgSelector');
    return annotation.selector.page;
  });

  const latestAnnotation = createMemo(() => maxBy(props.value, ({ createdAt }) => createdAt)!);

  function jumpTo() {
    props.pdfViewer.jumpToAnnotation(latestAnnotation());
  }

  return (
    <div class="border p-2 space-y-2" onClick={jumpTo}>
      <div class="flex text-sm justify-between">
        <span>第{page()}页</span>
        <span>共{props.value.length}个标记</span>
      </div>
      <div class="text-sm text-left">
        <time>最近标记于{dayjs(latestAnnotation().createdAt).format('YYYY年MM月DD日 HH:mm:ss')}</time>
      </div>
    </div>
  );
}
