import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import type { HighlightAreaVO } from 'interface/material';
import ctx from '../Context';

export default observer(function HighlightArea({ area, page }: { area: HighlightAreaVO; page: number }) {
  const { pdfViewer } = useContext(ctx);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { horizontalRatio, verticalRatio } = pdfViewer!.getPageRatio(page);

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
