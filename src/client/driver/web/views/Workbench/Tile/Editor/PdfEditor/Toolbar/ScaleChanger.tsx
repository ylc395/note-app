import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';

import PdfViewer, { ScaleValues, SCALE_STEPS } from '../PdfViewer';
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
  const {
    editor: { viewer },
  } = useContext(context);

  if (!PdfViewer.is(viewer)) {
    return null;
  }

  return (
    <div>
      <Button
        disabled={!viewer || viewer.scale === SCALE_STEPS[0]}
        type="text"
        size="small"
        icon={<MinusOutlined />}
        onClick={() => viewer?.setScale('down')}
      />
      {viewer && (
        <Select
          onChange={(v) => viewer.setScale(v)}
          className="w-28"
          size="small"
          value={scaleValues.includes(viewer.scale) ? viewer.scale : `${(viewer.scale as number) * 100}%`}
          options={scaleOptions}
        />
      )}
      <Button
        disabled={!viewer || viewer.scale === SCALE_STEPS[SCALE_STEPS.length - 1]}
        type="text"
        size="small"
        icon={<PlusOutlined />}
        onClick={() => viewer?.setScale('up')}
      />
    </div>
  );
});
