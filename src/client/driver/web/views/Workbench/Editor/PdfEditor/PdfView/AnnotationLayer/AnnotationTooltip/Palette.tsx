import { observer } from 'mobx-react-lite';

import { ANNOTATION_COLORS } from 'model/material/Editor';

export default observer(function SelectionTooltip({ onSelect }: { onSelect: (color: string) => void }) {
  return (
    <div className="flex items-center rounded bg-gray-300 py-1">
      {ANNOTATION_COLORS.map((color) => (
        <button
          className="mx-1 h-5 w-5 cursor-pointer rounded-full border-none "
          key={color}
          onClick={() => onSelect(color)}
          style={{ backgroundColor: color }}
        ></button>
      ))}
    </div>
  );
});
