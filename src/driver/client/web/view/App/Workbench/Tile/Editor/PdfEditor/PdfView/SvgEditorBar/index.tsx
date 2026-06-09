import { MousePointerSquareDashedIcon } from 'lucide-solid';
import ShapeSelector from './ShapeSelector';
import { Mode } from '#domain/client/app/model/Workbench/noteEditor/PdfEditor/SvgAnnotationEditor';
import { useContext } from '../../context';

export default function SvgEditorBar() {
  const {
    viewer: { editor },
  } = useContext()!;

  return (
    <div class="flex justify-center items-center space-x-4 bg-bg-primary z-10">
      <ShapeSelector />
      <button class="flex items-center" onClick={() => editor.svgEditor.toggleMode(Mode.Select)}>
        <MousePointerSquareDashedIcon />
      </button>
    </div>
  );
}
