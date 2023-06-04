import { useContext } from 'react';
import { observer } from 'mobx-react-lite';

import { HighlightColors } from 'model/material/PdfEditor';
import context from '../../../Context';

const colors = [
  HighlightColors.Blue,
  HighlightColors.Gray,
  HighlightColors.Purple,
  HighlightColors.Red,
  HighlightColors.Yellow,
];

export default observer(function SelectionTooltip({ onSelect }: { onSelect?: (color: HighlightColors) => void }) {
  const { pdfViewer } = useContext(context);

  return (
    <div className="flex items-center rounded bg-gray-300 py-1">
      {colors.map((color) => (
        <button
          className="mx-1 h-5 w-5 cursor-pointer rounded-full border-none "
          key={color}
          onClick={() => (onSelect ? onSelect(color) : pdfViewer?.createHighlight(color))}
          style={{ backgroundColor: color }}
        ></button>
      ))}
    </div>
  );
});
