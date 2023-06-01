import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { Resizable } from 're-resizable';
import clsx from 'clsx';

import type { OutlineItem } from 'model/material/PdfEditor';
import context from './Context';

const OutlineItemView = observer(function OutlineItemView({
  item: { title, children, key },
  level,
}: {
  item: OutlineItem;
  level: number;
}) {
  const { pdfViewer } = useContext(context);
  const page = pdfViewer?.editor.outlinePageNumberMap[key];

  return (
    <div style={{ paddingLeft: level * 5 }} className="mb-2">
      <div
        onClick={() => page && pdfViewer?.jumpToPage(page)}
        className={clsx('mb-2 text-sm', page ? 'cursor-pointer' : '')}
      >
        {title}
      </div>
      {children.map((item) => (
        <OutlineItemView key={item.key} item={item} level={level + 1} />
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
      {pdfViewer.editor.outline.map((item) => (
        <OutlineItemView level={1} item={item} key={item.key} />
      ))}
    </Resizable>
  );
});
