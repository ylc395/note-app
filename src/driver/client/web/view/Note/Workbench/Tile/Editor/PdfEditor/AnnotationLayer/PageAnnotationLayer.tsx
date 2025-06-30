import { createMemo, onMount } from 'solid-js';
import { autoUpdate, computePosition } from '@floating-ui/dom';
import { Key } from '@solid-primitives/keyed';

import type PdfViewer from '../PDFViewer';
import TextAnnotation from './TextAnnotation';
import SvgAnnotation from './SvgAnnotation';

export default function PageAnnotationLayer(props: { page: number; pdfViewer: PdfViewer }) {
  let divRef: HTMLDivElement | undefined;
  const { element: pageElement } = props.pdfViewer.getPageElement(props.page);

  const textAnnotations = createMemo(
    () =>
      props.pdfViewer.editor.annotation.items.result.data?.filter(
        ({ selector }) =>
          selector.type === 'PDFTextPositionSelector' &&
          props.page >= selector.position.startPage &&
          props.page <= selector.position.endPage,
      ) || [],
  );

  const svgAnnotations = createMemo(
    () =>
      props.pdfViewer.editor.annotation.items.result.data?.filter(
        ({ selector }) => selector.type === 'PDFSvgSelector' && props.page === selector.page,
      ) || [],
  );

  onMount(() => {
    autoUpdate(pageElement, divRef!, () => {
      computePosition(pageElement, divRef!, { placement: 'top' }).then(({ x, y }) => {
        Object.assign(divRef!.style, { left: `${x}px`, top: `${y}px` });
      });
    });
  });

  return (
    <div
      ref={divRef}
      class="absolute translate-y-full pointer-events-none"
      data-page={props.page} // 便于 debug 的，没什么实际用处
      style={{ width: `${pageElement.clientWidth}px`, height: `${pageElement.clientHeight}px` }}
    >
      <Key each={textAnnotations()} by="id">
        {(annotation) => <TextAnnotation page={props.page} annotation={annotation()} pdfViewer={props.pdfViewer} />}
      </Key>
      <Key each={svgAnnotations()} by="id">
        {(annotation) => <SvgAnnotation annotation={annotation()} />}
      </Key>
    </div>
  );
}
