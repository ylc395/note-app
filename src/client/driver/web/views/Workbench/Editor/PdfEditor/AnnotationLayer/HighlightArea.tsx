import type { HighlightAreaVO } from 'interface/material';
import { observer } from 'mobx-react-lite';

export default observer(function HighlightArea({
  area,
  ratios,
}: {
  area: HighlightAreaVO;
  ratios: { vertical: number; horizontal: number };
}) {
  return (
    <mark
      className="absolute z-10"
      style={{
        backgroundColor: area.color || 'yellow',
        width: area.rect.width / ratios.horizontal,
        height: area.rect.height / ratios.vertical,
        left: area.rect.x / ratios.horizontal,
        top: area.rect.y / ratios.vertical,
      }}
    ></mark>
  );
});
