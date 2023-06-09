import { observer } from 'mobx-react-lite';

import { AnnotationTypes, type AnnotationVO } from 'interface/material';
import ctx from '../Context';
import { useContext } from 'react';

export default observer(function Annotation({ annotation }: { annotation: AnnotationVO }) {
  const { htmlViewer } = useContext(ctx);

  return (
    <div className="border-0 border-b border-dashed border-gray-400 py-8">
      <div
        className="border-0 border-l-2 border-solid pl-2 text-sm text-gray-400"
        style={{ borderColor: annotation.color }}
        onClick={() => htmlViewer?.jumpToAnnotation(annotation)}
      >
        {annotation.type === AnnotationTypes.HtmlElement && (
          <img className="max-w-full opacity-70" src={annotation.snapshot} />
        )}
      </div>
      <div className="mt-2 whitespace-pre">{annotation.comment}</div>
    </div>
  );
});
