import { type CSSProperties, forwardRef } from 'react';

import Palette from './AnnotationLayer/HighlightTooltip/Palette';

interface Props {
  style?: CSSProperties;
}

// eslint-disable-next-line mobx/missing-observer
export default forwardRef<HTMLDivElement | null, Props>(function SelectionTooltip({ style }, ref) {
  return (
    <div className="pdf-editor-tooltip z-10" ref={ref} style={style}>
      <Palette />
    </div>
  );
});
