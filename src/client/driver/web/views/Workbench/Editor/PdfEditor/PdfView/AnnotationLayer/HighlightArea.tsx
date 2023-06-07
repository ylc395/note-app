import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import clsx from 'clsx';

import type { PdfAreaAnnotationVO } from 'interface/material';
import ctx from '../../Context';
import { BUFFER } from './constants';

export default observer(function HighlightArea({ area, page }: { area: PdfAreaAnnotationVO; page: number }) {
  const { pdfViewer, hoveringAnnotationId } = useContext(ctx);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { horizontalRatio, verticalRatio } = pdfViewer!.getPageRatio(page);

  return (
    <mark
      data-annotation-id={area.id}
      className={clsx(
        'absolute z-20 cursor-pointer bg-clip-content opacity-30',
        area.id === hoveringAnnotationId ? 'brightness-150' : null,
      )}
      style={{
        borderBottom: area.id === hoveringAnnotationId ? `solid transparent ${BUFFER}px` : 0,
        backgroundColor: area.color || 'yellow',
        width: area.rect.width * horizontalRatio,
        height: area.rect.height * verticalRatio,
        left: area.rect.x * horizontalRatio,
        top: area.rect.y * verticalRatio,
      }}
    ></mark>
  );
});
