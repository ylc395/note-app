import type svgEditor from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';
import { MousePointerSquareDashedIcon } from 'lucide-solid';
import ShapeSelector from './ShapeSelector';
import { Mode } from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';

export default function SvgEditorBar(props: { svgEditor: svgEditor }) {
  return (
    <div class="flex justify-center items-center space-x-4 bg-white z-10">
      <ShapeSelector svgEditor={props.svgEditor} />
      <button class="flex items-center" onClick={() => props.svgEditor.toggleMode(Mode.Select)}>
        <MousePointerSquareDashedIcon />
      </button>
    </div>
  );
}
