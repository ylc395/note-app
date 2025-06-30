import { EraserIcon } from 'lucide-solid';
import type CanvasManager from '#domain/client/app/model/note/editor/PdfEditor/CanvasManager';

export default function ModeSelector(props: { canvas: CanvasManager }) {
  return (
    <button onClick={() => props.canvas.toggleMode()} class="flex items-center">
      <EraserIcon />
    </button>
  );
}
