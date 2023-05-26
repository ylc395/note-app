import { observer } from 'mobx-react-lite';
import type PdfViewer from '../PdfViewer';

export default observer(function HighlightFragment({
  pdfViewer,
  page,
  fragment: { rect, color },
}: {
  fragment: {
    rect: { x: number; y: number; height: number; width: number };
    color: string;
  };
  pdfViewer: PdfViewer;
  page: number;
}) {
  const { horizontalRatio, verticalRatio } = pdfViewer.getPageRatio(page);

  return (
    <mark
      className="absolute z-10"
      style={{
        backgroundColor: color,
        width: rect.width * horizontalRatio,
        height: rect.height * verticalRatio,
        left: rect.x * horizontalRatio,
        top: rect.y * verticalRatio,
      }}
    ></mark>
  );
});
