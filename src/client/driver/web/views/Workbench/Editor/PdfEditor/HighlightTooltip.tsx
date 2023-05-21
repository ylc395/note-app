import type PdfViewer from 'web/views/Workbench/Editor/PdfEditor/PdfViewer';

const COLORS = ['#000', '#aaa', '#888', '#ddd'];

// eslint-disable-next-line mobx/missing-observer
export default (function MarkTooltip({ pdfViewer }: { pdfViewer: PdfViewer | null }) {
  return (
    <div className="flex">
      {COLORS.map((color) => (
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
