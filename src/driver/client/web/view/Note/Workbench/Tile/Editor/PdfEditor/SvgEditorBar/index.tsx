import type svgEditor from '#domain/client/app/model/note/editor/PdfEditor/SvgAnnotationEditor';
import EraseButton from './EraseButton';
import ShapeSelector from './ShapeSelector';

export default function SvgEditorBar(props: { svgEditor: svgEditor }) {
  return (
    <div class="flex justify-center space-x-4 bg-white z-10">
      <ShapeSelector svgEditor={props.svgEditor} />
      <EraseButton svgEditor={props.svgEditor} />
    </div>
  );
}
