import { Key } from '@solid-primitives/keyed';
import { identity } from 'lodash-es';
import { Show } from 'solid-js';

import type PdfViewer from '../PDFViewer';
import PageAnnotationLayer from './PageAnnotationLayer';

export default function AnnotationLayer(props: { pdfViewer: PdfViewer }) {
  return (
    <Show when={props.pdfViewer.isReady}>
      <div
        data-layer-type="annotation" // 便于 debug 的，没什么实际用处
      >
        <Key each={props.pdfViewer.renderedPages} by={identity}>
          {(page) => <PageAnnotationLayer page={page()} pdfViewer={props.pdfViewer} />}
        </Key>
      </div>
    </Show>
  );
}
