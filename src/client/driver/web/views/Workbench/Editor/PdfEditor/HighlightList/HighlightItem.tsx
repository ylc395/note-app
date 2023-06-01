import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import {
  AnnotationTypes,
  HighlightVO,
  type HighlightAnnotationVO,
  type HighlightAreaAnnotationVO,
  HighlightAreaVO,
} from 'interface/material';
import context from '../Context';

export default observer(function HighlightItem({
  highlight: { annotation, comment, startPage, endPage, type },
}: {
  highlight: (HighlightAnnotationVO | HighlightAreaAnnotationVO) & { startPage: number; endPage: number };
}) {
  const { pdfViewer } = useContext(context);

  return (
    <div className="border-0 border-b border-dashed border-gray-400 py-8">
      <div
        className="cursor-pointer border-0 border-l-2 border-solid pl-2 text-sm text-gray-400"
        style={{ borderColor: annotation.color }}
        onClick={() => pdfViewer?.jumpToPage(startPage)}
      >
        {type === AnnotationTypes.Highlight && (
          <blockquote className="m-0">{(annotation as HighlightVO).content}</blockquote>
        )}
        {type === AnnotationTypes.HighlightArea && (
          <img className="max-w-full opacity-70" src={(annotation as HighlightAreaVO).snapshot} />
        )}
        <div className="mt-2 pr-2 text-right italic">
          {startPage === endPage ? `第${startPage}页` : `第${startPage}页-第${endPage}页`}
        </div>
      </div>
      <div className="mt-2 whitespace-pre">{comment}</div>
    </div>
  );
});
