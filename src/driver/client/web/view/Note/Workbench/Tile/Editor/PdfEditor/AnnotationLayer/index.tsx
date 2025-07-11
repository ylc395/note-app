import { createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { autoUpdate, computePosition, offset } from '@floating-ui/dom';
import { Key } from '@solid-primitives/keyed';
import { makeResizeObserver } from '@solid-primitives/resize-observer';

import type PdfViewer from '../PDFViewer';
import TextAnnotation from './TextAnnotation';
import SvgAnnotation from './SvgAnnotation';
import SvgEditor from './SvgEditor';
import { Mode } from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';

export default function PageAnnotationLayer(props: { page: number; pdfViewer: PdfViewer }) {
  let divRef: HTMLDivElement | undefined;
  const [getSVGElement, setSVGElement] = createSignal<SVGAElement>();
  const { height: pageHeight, width: pageWidth, element: pageElement } = props.pdfViewer.getPageInfo(props.page);
  const resizeObserver = makeResizeObserver(updateElementSize, { box: 'content-box' });
  const [getElementSize, setElementSize] = createSignal({
    width: pageElement.clientWidth,
    height: pageElement.clientHeight,
  });

  const pageScale = createMemo(() => ({
    width: getElementSize().width / pageWidth,
    height: getElementSize().height / pageHeight,
  }));

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

  resizeObserver.observe(pageElement); // observe 的时候回调函数就会被调用一次，而不必等尺寸真的发生变化

  function updateElementSize() {
    setElementSize({ width: pageElement.clientWidth, height: pageElement.clientHeight });
  }

  onMount(() => {
    // 这里我们不考虑用其它元素做基准（例如 textLayer)，因为那些元素在此时很可能还没正确渲染出来
    const stopAutoUpdate = autoUpdate(pageElement, divRef!, () => {
      computePosition(pageElement, divRef!, {
        middleware: [
          offset(({ rects }) => {
            return -rects.reference.height / 2 - rects.floating.height / 2;
          }),
        ],
      }).then(({ x, y }) => {
        Object.assign(divRef!.style, { left: `${x}px`, top: `${y}px` });
      });
    });
    onCleanup(stopAutoUpdate);
  });

  return (
    <div
      ref={divRef}
      class="absolute pointer-events-none"
      data-page={props.page} // 便于 debug 的，没什么实际用处
      style={{ width: `${getElementSize().width}px`, height: `${getElementSize().height}px` }}
    >
      <Key each={textAnnotations()} by="id">
        {(annotation) => <TextAnnotation page={props.page} annotation={annotation()} pdfViewer={props.pdfViewer} />}
      </Key>
      <Show when={svgAnnotations().length > 0 || props.pdfViewer.editor.annotation.svgEditor.isEnabled}>
        <svg
          ref={setSVGElement}
          viewBox={`0 0 ${pageWidth} ${pageHeight}`}
          preserveAspectRatio="xMidYMid meet"
          class="w-full h-full"
        >
          <Key each={svgAnnotations()} by="id">
            {(annotation) => (
              <SvgAnnotation
                viewBox={{ width: pageWidth, height: pageHeight }}
                annotation={annotation()}
                annotationManager={props.pdfViewer.editor.annotation}
                page={props.page}
              />
            )}
          </Key>
          <Show
            when={
              props.pdfViewer.editor.annotation.svgEditor.isEnabled &&
              props.pdfViewer.editor.annotation.svgEditor.mode === Mode.Draw &&
              getSVGElement()
            }
          >
            {(svg) => (
              <SvgEditor
                svgElement={svg()}
                viewBox={{ width: pageWidth, height: pageHeight }}
                page={props.page}
                pageScale={pageScale()}
                pdfViewer={props.pdfViewer}
              />
            )}
          </Show>
        </svg>
      </Show>
    </div>
  );
}
