import { Show } from 'solid-js';

import SvgAnnotationEditor, {
  Shape,
} from '#domain/client/app/model/Workbench/noteEditor/PdfEditor/SvgAnnotationEditor';
import FreeShape from './FreeShape';
import RegularShape from './RegularShape';
import { useContext } from '../../../context';

export default function SvgEditor(props: {
  page: number;
  pageScale: { width: number; height: number };
  viewBox: { width: number; height: number };
  svgElement: SVGAElement;
}) {
  const {
    viewer: { viewer, editor },
  } = useContext()!;
  const { element } = viewer.getPageInfo(props.page);

  function onCreate(value: string) {
    editor.annotation.create(SvgAnnotationEditor.toSvgSelector(props.viewBox, props.page, value));
  }

  return (
    <Show
      when={editor.svgEditor.shape === Shape.Free}
      fallback={
        <RegularShape
          color={editor.svgEditor.color}
          fillColor={editor.svgEditor.fillColor}
          pageElement={element}
          shape={editor.svgEditor.shape}
          thickness={editor.svgEditor.thickness}
          svgElement={props.svgElement}
          onCreate={onCreate}
        />
      }
    >
      <FreeShape
        pageScale={props.pageScale}
        thickness={editor.svgEditor.thickness}
        pageElement={element}
        color={editor.svgEditor.color}
        onCreate={onCreate}
      />
    </Show>
  );
}
