import { type CSSProperties, forwardRef, useContext } from 'react';

import Palette from '../AnnotationLayer/HighlightTooltip/Palette';
import Context from '../../Context';

interface Props {
  style?: CSSProperties;
}

// eslint-disable-next-line mobx/missing-observer
export default forwardRef<HTMLDivElement | null, Props>(function SelectionTooltip({ style }, ref) {
  const { pdfViewer } = useContext(Context);

  return (
    <div className="z-10" ref={ref} style={style}>
      <Palette onSelect={(color) => pdfViewer?.createHighlight(color)} />
    </div>
  );
});
