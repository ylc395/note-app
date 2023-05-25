import { observer } from 'mobx-react-lite';

export default observer(function HighlightFragment({
  fragment: { color, rect },
  ratios: { horizontal, vertical },
}: {
  fragment: {
    rect: { x: number; y: number; height: number; width: number };
    color: string;
  };
  ratios: { vertical: number; horizontal: number };
}) {
  return (
    <mark
      className="absolute z-10"
      style={{
        backgroundColor: color,
        width: rect.width / horizontal,
        height: rect.height / vertical,
        left: rect.x / horizontal,
        top: rect.y / vertical,
      }}
    ></mark>
  );
});
