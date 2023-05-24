import { type CSSProperties, forwardRef } from 'react';

import { HighlightColors } from 'model/material/PdfEditor';
import type PdfViewer from 'web/views/Workbench/Editor/PdfEditor/PdfViewer';

const colors = [
  HighlightColors.Blue,
  HighlightColors.Gray,
  HighlightColors.Purple,
  HighlightColors.Red,
  HighlightColors.Yellow,
];

interface Props {
  pdfViewer: PdfViewer | null;
  style?: CSSProperties;
  attributes?: Record<string, string>;
}

// eslint-disable-next-line mobx/missing-observer
export default forwardRef<HTMLDivElement | null, Props>(function MarkTooltip({ pdfViewer, style, attributes }, ref) {
  return (
    <div className="pdf-editor-tooltip z-10" ref={ref} hidden style={style} {...attributes}>
      <div className="flex">
        {colors.map((color) => (
          <button
            className="h-4 w-4"
            key={color}
            onClick={() => pdfViewer?.createHighlight(color)}
            style={{ backgroundColor: color }}
          ></button>
        ))}
      </div>
    </div>
  );
});
