import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { AnnotationTypes, type PdfRangeAnnotationVO, type PdfAreaAnnotationVO } from 'interface/material';
import context from '../Context';

export default observer(function HighlightItem({
  highlight,
}: {
  highlight: (PdfRangeAnnotationVO | PdfAreaAnnotationVO) & { startPage: number; endPage: number };
}) {
  const { pdfViewer } = useContext(context);
  const { startPage, endPage, comment } = highlight;

  return (
    <div className="border-0 border-b border-dashed border-gray-400 py-8">
      <div
        className="cursor-pointer border-0 border-l-2 border-solid pl-2 text-sm text-gray-400"
        style={{ borderColor: highlight.color }}
        onClick={() => pdfViewer?.jumpToPage(highlight.startPage)}
      >
        {highlight.type === AnnotationTypes.PdfRange && <blockquote className="m-0">{highlight.content}</blockquote>}
        {highlight.type === AnnotationTypes.PdfArea && (
          <img className="max-w-full opacity-70" src={highlight.snapshot} />
        )}
        <div className="mt-2 pr-2 text-right italic">
          {startPage === endPage ? `第${startPage}页` : `第${startPage}页-第${endPage}页`}
        </div>
      </div>
      <div className="mt-2 whitespace-pre">{comment}</div>
    </div>
  );
});
