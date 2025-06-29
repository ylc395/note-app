import { Key } from '@solid-primitives/keyed';
import { identity } from 'lodash-es';
import { Show } from 'solid-js';

import PdfViewer from '../PDFViewer';
import Canvas from './Canvas';

export default function CanvasLayer(props: { pdfViewer: PdfViewer }) {
  return (
    <Show when={props.pdfViewer.isReady && props.pdfViewer.editor.canvas.isEnabled}>
      <div
        data-layer-type="canvas" // 便于 debug 的，没什么实际用处
      >
        <Key each={props.pdfViewer.renderedPages} by={identity}>
          {(page) => <Canvas page={page()} pdfViewer={props.pdfViewer} />}
        </Key>
      </div>
    </Show>
  );
}
