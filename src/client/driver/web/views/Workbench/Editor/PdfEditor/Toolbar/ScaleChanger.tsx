import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';

import { ScaleValues, SCALE_STEPS } from '../PdfViewer';
import context from '../Context';

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

export default observer(function ScaleChanger() {
  const { pdfViewer } = useContext(context);

  return (
    <div>
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
  );
});
