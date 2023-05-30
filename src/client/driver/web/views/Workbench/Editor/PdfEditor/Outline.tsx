import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Resizable } from 're-resizable';

import context from './Context';
import type { OutlineItem } from './PdfViewer';

const OutlineItemView = observer(function OutlineItemView({
  item: { title, children },
  level,
}: {
  item: OutlineItem;
  level: number;
}) {
  return (
    <div style={{ paddingLeft: level * 5 }} className="mb-2">
      <div className="mb-2">{title}</div>
      {children.map((item, i) => (
        <OutlineItemView key={`${level}-${i}`} item={item} level={level + 1} />
      ))}
    </div>
  );
});

export default observer(function Outline() {
  const { pdfViewer } = useContext(context);

  if (!pdfViewer?.outline) {
    return null;
  }

  return (
    <Resizable enable={{ right: true }} defaultSize={{ width: 300, height: 'auto' }} className="h-full overflow-auto">
      {pdfViewer.outline.map((item, i) => (
        <OutlineItemView level={1} item={item} key={i} />
      ))}
    </Resizable>
  );
});
