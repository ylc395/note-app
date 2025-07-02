import { EraserIcon } from 'lucide-solid';
import type svgEditor from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';

export default function ModeSelector(props: { svgEditor: svgEditor }) {
  return (
    <button onClick={() => props.svgEditor.toggleMode()} class="flex items-center">
      <EraserIcon />
    </button>
  );
}
