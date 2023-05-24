import { useState } from 'react';
import { useLongPress, useMouse } from 'ahooks';

// eslint-disable-next-line mobx/missing-observer
export default function HighlightArea({ textLayerEl }: { textLayerEl: HTMLElement }) {
  const { elementX, elementY, elementW, elementH } = useMouse(textLayerEl);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  useLongPress(
    () => {
      setStartPos({ x: elementX, y: elementY });
      textLayerEl?.classList.add('select-none');
    },
    textLayerEl,
    {
      onLongPressEnd: () => {
        setStartPos(null);
        textLayerEl?.classList.remove('select-none');
      },
    },
  );

  const pos = startPos && {
    [elementX > startPos.x ? 'left' : 'right']: elementX > startPos.x ? startPos.x : elementW - startPos.x,
    [elementY > startPos.y ? 'top' : 'bottom']: elementY > startPos.y ? startPos.y : elementH - startPos.y,
    width: Math.abs(elementX - startPos.x),
    height: Math.abs(elementY - startPos.y),
  };

  if (!pos) {
    return null;
  }

  return <div className="absolute bg-yellow-400" style={pos}></div>;
}
