import { createMemo, Show, type JSX } from 'solid-js';
import { SVG } from '@svgdotjs/svg.js';

import { Shape } from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';
import FreeShape from './FreeShape';
import type PdfViewer from '../../PDFViewer';

export default function SvgEditor(props: {
  pdfViewer: PdfViewer;
  page: number;
  pageScale: { width: number; height: number };
  viewBox: { width: number; height: number };
}) {
  const shape = createMemo(() => props.pdfViewer.editor.annotation.svgEditor.options.get('shape'));
  const color = createMemo(() => props.pdfViewer.editor.annotation.svgEditor.options.get('color'));
  const thickness = createMemo(() => props.pdfViewer.editor.annotation.svgEditor.options.get('thickness'));

  const { element } = props.pdfViewer.getPageInfo(props.page);

  function onCreate(value: JSX.PathSVGAttributes<SVGPathElement>) {
    const draw = SVG().viewbox({ ...props.viewBox, x: 0, y: 0 });
    draw.path().attr(value).addTo(draw);

    props.pdfViewer.editor.annotation.create({
      selector: { type: 'PDFSvgSelector', page: props.page, svg: draw.svg() },
    });
  }

  return (
    <Show when={shape() === Shape.Free}>
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
