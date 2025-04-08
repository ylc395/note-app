import type { NativeAnnotation } from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import AnnotationManager from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import type { AnnotationVO } from '#domain/shared/model/annotation';

export default function Item(props: { value: AnnotationVO | NativeAnnotation }) {
  const content = AnnotationManager.isNative(props.value) ? props.value.contentsObj?.str : props.value.body;

  return <div>{content}</div>;
}
