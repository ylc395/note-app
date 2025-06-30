import type CanvasManager from '#domain/client/app/model/note/editor/PdfEditor/CanvasManager';
import EraseButton from './EraseButton';
import ShapeSelector from './ShapeSelector';

export default function CanvasEditorBar(props: { canvas: CanvasManager }) {
  return (
    <div class="flex justify-center space-x-4">
      <ShapeSelector canvas={props.canvas} />
      <EraseButton canvas={props.canvas} />
    </div>
  );
}
