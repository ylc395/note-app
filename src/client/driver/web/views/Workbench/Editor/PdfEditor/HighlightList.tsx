import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { AnnotationTypes } from 'interface/material';
import context from './Context';

export default observer(function HighlightList() {
  const { pdfViewer } = useContext(context);

  return (
    <div className="w-60 overflow-auto">
      {pdfViewer?.editor.highlights.map(({ type, annotation, id }) => {
        if (type === AnnotationTypes.Highlight) {
          return (
            <div key={id} className="mb-2 text-sm" style={{ color: annotation.color }}>
              {annotation.content}
            </div>
          );
        }

        if (type === AnnotationTypes.HighlightArea) {
          return (
            <div key={id}>
              <img src={annotation.snapshot} />
            </div>
          );
        }
      })}
    </div>
  );
});
