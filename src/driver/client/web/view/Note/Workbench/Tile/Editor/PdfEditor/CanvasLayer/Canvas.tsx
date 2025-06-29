import { onMount } from 'solid-js';
import { autoUpdate, computePosition } from '@floating-ui/dom';

import type PdfViewer from '../PDFViewer';
import './style.css';

export default function Canvas(props: { page: number; pdfViewer: PdfViewer }) {
  let divRef: HTMLDivElement | undefined;
  const pageElement = props.pdfViewer.getPageElement(props.page);

  onMount(() => {
    autoUpdate(pageElement, divRef!, () => {
      computePosition(pageElement, divRef!, { placement: 'top' }).then(({ x, y }) => {
        Object.assign(divRef!.style, { left: `${x}px`, top: `${y}px` });
      });
    });
  });

  return (
    <div
      data-page={props.page}
      class="absolute"
      style={{ width: `${pageElement.clientWidth}px`, height: `${pageElement.clientHeight}px` }}
      ref={divRef}
    ></div>
  );
}
