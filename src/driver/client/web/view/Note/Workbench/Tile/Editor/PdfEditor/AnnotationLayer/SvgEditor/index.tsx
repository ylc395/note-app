import { createMemo, Show } from 'solid-js';

import SvgAnnotationEditor, { Shape } from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';
import FreeShape from './FreeShape';
import RegularShape from './RegularShape';
import type PdfViewer from '../../PDFViewer';

export default function SvgEditor(props: {
  pdfViewer: PdfViewer;
  page: number;
  pageScale: { width: number; height: number };
  viewBox: { width: number; height: number };
  svgElement: SVGAElement;
}) {
  const shape = createMemo(() => props.pdfViewer.editor.annotation.svgEditor.options.get('shape'));
  const color = createMemo(() => props.pdfViewer.editor.annotation.svgEditor.options.get('color'));
  const fillColor = createMemo(() => props.pdfViewer.editor.annotation.svgEditor.options.get('fillColor'));
  const thickness = createMemo(() => props.pdfViewer.editor.annotation.svgEditor.options.get('thickness'));

  const { element } = props.pdfViewer.getPageInfo(props.page);

  function onCreate(value: string) {
    props.pdfViewer.editor.annotation.create(SvgAnnotationEditor.toSvgSelector(props.viewBox, props.page, value));
  }

  return (
    <Show
      when={shape() === Shape.Free}
      fallback={
        <RegularShape
          color={color()}
          fillColor={fillColor()}
          pageElement={element}
          shape={shape()}
          thickness={thickness()}
          svgElement={props.svgElement}
          onCreate={onCreate}
        />
      }
    >
      <FreeShape
        pageScale={props.pageScale}
        thickness={thickness()}
        pageElement={element}
        color={color()}
        onCreate={onCreate}
      />
    </Show>
  );
}
