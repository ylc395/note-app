import { Key } from '@solid-primitives/keyed';
import { identity } from 'lodash-es';

import type PdfViewer from '../PDFViewer';
import PageAnnotationLayer from './PageAnnotationLayer';

export default function AnnotationLayer(props: { pdfViewer: PdfViewer }) {
  return (
    <div>
      <Key each={props.pdfViewer.renderedPages} by={identity}>
        {(page) => <PageAnnotationLayer page={page()} pdfViewer={props.pdfViewer} />}
      </Key>
    </div>
  );
}
