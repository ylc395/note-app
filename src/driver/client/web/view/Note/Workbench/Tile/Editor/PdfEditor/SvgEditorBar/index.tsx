import type svgEditor from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';
import { BoxSelectIcon } from 'lucide-solid';
import ShapeSelector from './ShapeSelector';

export default function SvgEditorBar(props: { svgEditor: svgEditor }) {
  return (
    <div class="flex justify-center items-center space-x-4 bg-white z-10">
      <ShapeSelector svgEditor={props.svgEditor} />
      <button class="flex items-center">
        <BoxSelectIcon />
      </button>
    </div>
  );
}
