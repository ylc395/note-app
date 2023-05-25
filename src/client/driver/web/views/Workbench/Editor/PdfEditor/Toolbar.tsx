import { Button, InputNumber } from 'antd';
import { observer } from 'mobx-react-lite';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';

import type PdfViewer from 'web/views/Workbench/Editor/PdfEditor/PdfViewer';

const SCALE_VALUES = ['auto', 'page-width', 'page-fit', 'page-actual'];

export default observer(function Toolbar({ pdfViewer }: { pdfViewer: PdfViewer | null }) {
  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <button>+</button>
        <select>
          <option></option>
        </select>
        <button>-</button>
      </div>
      <div className="mx-auto flex w-60 justify-center py-2">
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          disabled={pdfViewer?.page.current === 1}
          size="small"
          onClick={() => pdfViewer?.goToPreviousPage()}
        ></Button>
        <span className="px-2 text-sm">
          {pdfViewer && <InputNumber size="small" className="w-12" controls={false} value={pdfViewer.page.current} />} /
          {pdfViewer?.page.total || 0}
        </span>
        <Button
          icon={<ArrowRightOutlined />}
          size="small"
          type="text"
          disabled={pdfViewer?.page.current === pdfViewer?.page.total}
          onClick={() => pdfViewer?.goToNextPage()}
        ></Button>
      </div>
    </div>
  );
});
