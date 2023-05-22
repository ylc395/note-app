import { HighlightColors } from 'model/material/PdfEditor';
import type PdfViewer from 'web/views/Workbench/Editor/PdfEditor/PdfViewer';

const colors = [
  HighlightColors.Blue,
  HighlightColors.Gray,
  HighlightColors.Purple,
  HighlightColors.Red,
  HighlightColors.Yellow,
];

// eslint-disable-next-line mobx/missing-observer
export default (function MarkTooltip({ pdfViewer }: { pdfViewer: PdfViewer | null }) {
  return (
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
  );
});
