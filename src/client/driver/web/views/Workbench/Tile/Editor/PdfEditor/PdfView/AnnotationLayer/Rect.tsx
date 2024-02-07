import { observer } from 'mobx-react-lite';
import { AiOutlineComment } from 'react-icons/ai';
import { useContext } from 'react';
import assert from 'assert';
import { useFloating, useMergeRefs } from '@floating-ui/react';

import type { AnnotationVO } from '@shared/domain/model/annotation';
import context from '../../Context';
import PdfViewer from '../../PdfViewer';

interface Props {
  fragment: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    annotationId: AnnotationVO['id'];
    isLast: boolean;
  };
}

export default observer(function Rect({ fragment: { annotationId, isLast, ...rect } }: Props) {
  const { editor } = useContext(context);
  assert(editor.viewer instanceof PdfViewer);

  const annotation =
    annotationId === editor.viewer.annotationManager.commentArea.tempAnnotation?.id
      ? editor.viewer.annotationManager.commentArea.tempAnnotation
      : editor.getAnnotation(annotationId);
  const { body, color } = annotation;
  const isWithComment = Boolean(body) && isLast;

  const { refs: iconRefs, floatingStyles: iconStyles } = useFloating();
  const { refs: commentRefs, floatingStyles: commentStyles } = useFloating();
  const setReference = useMergeRefs([iconRefs.setReference, commentRefs.setReference]);

  return (
    <>
      <mark
        ref={setReference}
        onMouseEnter={() => editor.toggleAnnotationVisible(annotationId)}
        onMouseLeave={() => editor.toggleAnnotationVisible(annotationId)}
        onClick={() => editor.toggleAnnotationFixed(annotationId)}
        className="pointer-events-auto absolute cursor-pointer opacity-30"
        style={{ backgroundColor: color, ...rect }}
      />
      {isWithComment && (
        <span ref={iconRefs.setFloating} style={iconStyles} className="pointer-events-auto cursor-pointer text-black">
          <AiOutlineComment />
        </span>
      )}
      {isWithComment && editor.isAnnotationVisible(annotationId) && (
        <div className="pointer-events-auto absolute" ref={commentRefs.setFloating} style={commentStyles}>
          {body}
        </div>
      )}
    </>
  );
});
