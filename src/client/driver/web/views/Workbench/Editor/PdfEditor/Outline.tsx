import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Resizable } from 're-resizable';
import clsx from 'clsx';

import type { OutlineItem } from 'model/material/PdfEditor';
import context from './Context';

const OutlineItemView = observer(function OutlineItemView({
  item: { title, children, dest },
  level,
}: {
  item: OutlineItem;
  level: number;
}) {
  const { pdfViewer } = useContext(context);

  return (
    <div style={{ paddingLeft: level * 5 }} className="mb-2">
      <div onClick={() => pdfViewer?.jumpToPage(dest)} className={clsx('mb-2 text-sm', dest ? 'cursor-pointer' : '')}>
        {title}
      </div>
      {children.map((item, i) => (
        <OutlineItemView key={`${level}-${i}`} item={item} level={level + 1} />
      ))}
    </div>
  );
});

export default observer(function Outline() {
  const { pdfViewer } = useContext(context);

  if (!pdfViewer?.editor.outline) {
    return null;
  }

  return (
    <Resizable enable={{ right: true }} defaultSize={{ width: 300, height: 'auto' }} className="h-full overflow-auto">
      {pdfViewer.editor.outline.map((item, i) => (
        <OutlineItemView level={1} item={item} key={i} />
      ))}
    </Resizable>
  );
});
