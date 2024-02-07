import { observer } from 'mobx-react-lite';
import { AiOutlineComment } from 'react-icons/ai';
import { useContext } from 'react';
import assert from 'assert';
import { offset, useFloating, autoUpdate } from '@floating-ui/react';

import type { AnnotationVO } from '@shared/domain/model/annotation';
import context from '../../Context';
import PdfViewer from '../../PdfViewer';
import AnnotationBody from './AnnotationBody';
import { mapValues } from 'lodash-es';

interface Props {
  rect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    annotationId: AnnotationVO['id'];
    isLast: boolean;
  };
}

export default observer(function Rect({ rect: { annotationId, isLast, ...rect } }: Props) {
  const { editor } = useContext(context);
  assert(editor.viewer instanceof PdfViewer);

  const annotation =
    annotationId === editor.viewer.annotationManager.commentArea.tempAnnotation?.id
      ? editor.viewer.annotationManager.commentArea.tempAnnotation
      : editor.getAnnotation(annotationId);
  const { body, color } = annotation;
  const isVisible = editor.isAnnotationVisible(annotationId);
  const isWithComment = Boolean(body) && isLast;

  const { refs: commentRefs, floatingStyles: commentStyles } = useFloating({
    placement: 'right-start',
    middleware: [offset(10)],
    whileElementsMounted: autoUpdate,
  });

  return (
    <>
      <mark
        ref={commentRefs.setReference}
        onMouseEnter={() => editor.setAnnotationVisible(annotationId, true)}
        onMouseLeave={() => editor.setAnnotationVisible(annotationId, false)}
        onClick={() => editor.toggleAnnotationFixed(annotationId)}
        className="pointer-events-auto absolute cursor-pointer opacity-30"
        style={{ backgroundColor: color, ...mapValues(rect, (v) => `calc(var(--scale-factor) * ${v}px)`) }}
      >
        {isWithComment && !isVisible && (
          <span className="absolute -right-4 -top-2  text-black">
            <AiOutlineComment />
          </span>
        )}
      </mark>
      {isWithComment && isVisible && (
        <div className="pointer-events-auto" ref={commentRefs.setFloating} style={commentStyles}>
          <AnnotationBody annotation={annotation} />
        </div>
      )}
    </>
  );
});
