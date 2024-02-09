import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { AiOutlineZoomIn, AiOutlineZoomOut } from 'react-icons/ai';

import Button from '@web/components/Button';
import Select from '@web/components/Select';
import PdfViewer, { ScaleValues, SCALE_STEPS } from '../PdfViewer';
import context from '../Context';

const scaleOptions = [
  { label: 'auto', key: ScaleValues.Auto },
  { label: 'page-width', key: ScaleValues.PageWidth },
  { label: 'page-fit', key: ScaleValues.PageFit },
  { label: 'page-actual', key: ScaleValues.PageActual },
  { label: '50%', key: '0.5' },
  { label: '75%', key: '0.75' },
  { label: '100%', key: '1' },
  { label: '125%', key: '1.25' },
  { label: '150%', key: '1.5' },
  { label: '200%', key: '2' },
];

export default observer(function ScaleChanger() {
  const {
    editor: { viewer },
  } = useContext(context);

  if (!(viewer instanceof PdfViewer)) {
    return null;
  }

  return (
    <div className="flex">
      <Button
        disabled={!viewer || viewer.scale.value === SCALE_STEPS[0]}
        size="small"
        onClick={() => viewer?.setScale('down')}
      >
        <AiOutlineZoomOut />
      </Button>
      {viewer && (
        <Select
          onChange={(v) => viewer.setScale(v)}
          className="w-24 text-sm"
          value={String(viewer.scale.text)}
          options={scaleOptions}
        />
      )}
      <Button
        disabled={!viewer || viewer.scale.value === SCALE_STEPS[SCALE_STEPS.length - 1]}
        size="small"
        onClick={() => viewer?.setScale('up')}
      >
        <AiOutlineZoomIn />
      </Button>
    </div>
  );
});
