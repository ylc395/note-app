import { type CSSProperties, forwardRef, useContext } from 'react';

import { HighlightColors } from 'model/material/PdfEditor';
import context from './Context';

const colors = [
  HighlightColors.Blue,
  HighlightColors.Gray,
  HighlightColors.Purple,
  HighlightColors.Red,
  HighlightColors.Yellow,
];

interface Props {
  style?: CSSProperties;
}

// eslint-disable-next-line mobx/missing-observer
export default forwardRef<HTMLDivElement | null, Props>(function SelectionTooltip({ style }, ref) {
  const { pdfViewer } = useContext(context);

  return (
    <div className="pdf-editor-tooltip z-10" ref={ref} style={style}>
      <div className="flex items-center rounded bg-gray-300 py-1">
        {colors.map((color) => (
          <button
            className="mx-1 h-5 w-5 cursor-pointer rounded-full border-none "
            key={color}
            onClick={() => pdfViewer?.createHighlight(color)}
            style={{ backgroundColor: color }}
          ></button>
        ))}
      </div>
    </div>
  );
});
