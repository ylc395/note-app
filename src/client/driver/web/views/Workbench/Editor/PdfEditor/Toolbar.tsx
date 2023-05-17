import type PdfViewer from 'web/infra/PdfViewer';

const SCALE_VALUES = ['auto', 'page-width', 'page-fit', 'page-actual'];
// eslint-disable-next-line mobx/missing-observer
export default function Toolbar({ pdfViewer }: { pdfViewer: PdfViewer | null }) {
  return (
    <div>
      <div>
        <button onClick={() => pdfViewer?.goToPreviousPage()}>上一页</button>
        <button onClick={() => pdfViewer?.goToNextPage()}>下一页</button>
      </div>
      <div>
        <button>+</button>
        <select>
          <option></option>
        </select>
        <button>-</button>
      </div>
    </div>
  );
}
