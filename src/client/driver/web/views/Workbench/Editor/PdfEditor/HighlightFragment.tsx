import { observer } from 'mobx-react-lite';

export default observer(function HighlightFragment({
  fragment: { color, rect },
}: {
  fragment: {
    rect: { x: number; y: number; height: number; width: number };
    color: string;
  };
}) {
  return (
    <mark
      className="absolute"
      style={{ backgroundColor: color, width: rect.width, height: rect.height, left: rect.x, top: rect.y }}
    ></mark>
  );
});
