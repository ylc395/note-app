import { Show } from 'solid-js';

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
  const { element } = props.pdfViewer.getPageInfo(props.page);

  function onCreate(value: string) {
    props.pdfViewer.editor.annotation.create(SvgAnnotationEditor.toSvgSelector(props.viewBox, props.page, value));
  }

  return (
    <Show
      when={props.pdfViewer.editor.svgEditor.shape === Shape.Free}
      fallback={
        <RegularShape
          color={props.pdfViewer.editor.svgEditor.color}
          fillColor={props.pdfViewer.editor.svgEditor.fillColor}
          pageElement={element}
          shape={props.pdfViewer.editor.svgEditor.shape}
          thickness={props.pdfViewer.editor.svgEditor.thickness}
          svgElement={props.svgElement}
          onCreate={onCreate}
        />
      }
    >
      <FreeShape
        pageScale={props.pageScale}
        thickness={props.pdfViewer.editor.svgEditor.thickness}
        pageElement={element}
        color={props.pdfViewer.editor.svgEditor.color}
        onCreate={onCreate}
      />
    </Show>
  );
}
