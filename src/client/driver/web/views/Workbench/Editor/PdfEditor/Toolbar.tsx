import { Button, InputNumber, Select } from 'antd';
import { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { ArrowLeftOutlined, ArrowRightOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

import { ScaleValues, SCALE_STEPS } from './PdfViewer';
import context from './Context';

const scaleOptions = [
  { label: 'auto', value: ScaleValues.Auto },
  { label: 'page-width', value: ScaleValues.PageWidth },
  { label: 'page-fit', value: ScaleValues.PageFit },
  { label: 'page-actual', value: ScaleValues.PageActual },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 },
];

const scaleValues = scaleOptions.map(({ value }) => value) as Array<string | number>;

export default observer(function Toolbar() {
  const { pdfViewer } = useContext(context);

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 ml-2 -translate-y-1/2">
        <Button
          disabled={!pdfViewer || pdfViewer.scale === SCALE_STEPS[0]}
          type="text"
          size="small"
          icon={<MinusOutlined />}
          onClick={() => pdfViewer?.setScale('down')}
        />
        {pdfViewer && (
          <Select
            onChange={pdfViewer.setScale}
            className="w-28"
            size="small"
            value={scaleValues.includes(pdfViewer.scale) ? pdfViewer.scale : `${(pdfViewer.scale as number) * 100}%`}
            options={scaleOptions}
          />
        )}
        <Button
          disabled={!pdfViewer || pdfViewer.scale === SCALE_STEPS[SCALE_STEPS.length - 1]}
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => pdfViewer?.setScale('up')}
        />
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
