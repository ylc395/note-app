import { observer } from 'mobx-react-lite';

import type { HighlightAreaVO } from 'interface/material';
import type PdfViewer from '../PdfViewer';

export default observer(function HighlightArea({
  area,
  pdfViewer,
  page,
}: {
  area: HighlightAreaVO;
  pdfViewer: PdfViewer;
  page: number;
}) {
  const { horizontalRatio, verticalRatio } = pdfViewer.getPageRatio(page);

  return (
    <mark
      className="absolute z-10"
      style={{
        backgroundColor: area.color || 'yellow',
        width: area.rect.width * horizontalRatio,
        height: area.rect.height * verticalRatio,
        left: area.rect.x * horizontalRatio,
        top: area.rect.y * verticalRatio,
      }}
    ></mark>
  );
});
