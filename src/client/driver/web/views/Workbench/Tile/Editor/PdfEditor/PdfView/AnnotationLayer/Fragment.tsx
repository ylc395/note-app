import { observer } from 'mobx-react-lite';
import { AiOutlineComment } from 'react-icons/ai';
import { useContext } from 'react';

import context from '../../Context';
import type { AnnotationVO } from '@shared/domain/model/annotation';

interface Props {
  fragment: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    color: string;
    annotationId: AnnotationVO['id'];
    withComment: boolean;
  };
}

export default observer(function Fragment({ fragment: { withComment, color, annotationId, ...rect } }: Props) {
  const { editor } = useContext(context);
  const isVisible = editor.isVisible(annotationId);

  return (
    <>
      <span
        className="pointer-events-auto cursor-pointer "
        onMouseEnter={() => editor.toggleVisibleAnnotation(annotationId)}
        onMouseLeave={() => editor.toggleVisibleAnnotation(annotationId)}
        onClick={() => editor.toggleAnnotationFixed(annotationId)}
      >
        <mark className="absolute opacity-30" style={{ backgroundColor: color, ...rect }} />
        {withComment && (
          <AiOutlineComment style={{ right: rect.right - 10, top: rect.top - 10 }} className="absolute text-black" />
        )}
      </span>
      {isVisible && withComment && (
        <div
          className="pointer-events-auto absolute"
          style={{ right: rect.right - 20, top: rect.top - 10, transform: 'translateX(100%)' }}
        >
          {editor.getAnnotation(annotationId).body}
        </div>
      )}
    </>
  );
});
