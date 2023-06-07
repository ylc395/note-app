import { observer } from 'mobx-react-lite';

import { AnnotationTypes, HighlightElementAnnotationVO } from 'interface/material';

export default observer(function HighlightItem({ highlight }: { highlight: HighlightElementAnnotationVO }) {
  return (
    <div className="border-0 border-b border-dashed border-gray-400 py-8">
      <div
        className="border-0 border-l-2 border-solid pl-2 text-sm text-gray-400"
        style={{ borderColor: highlight.color }}
      >
        {highlight.type === AnnotationTypes.HighlightElement && (
          <img className="max-w-full opacity-70" src={highlight.snapshot} />
        )}
      </div>
      <div className="mt-2 whitespace-pre">{highlight.comment}</div>
    </div>
  );
});
