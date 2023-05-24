import { AnnotationTypes } from 'interface/material';
import { observer } from 'mobx-react-lite';
import type PdfEditor from 'model/material/PdfEditor';

export default observer(function HighlightList({ editor }: { editor: PdfEditor }) {
  return (
    <div className="w-60">
      {editor.highlights.map(({ type, annotation, id }) => {
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
