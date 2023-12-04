import { observer } from 'mobx-react-lite';
import { ReactNode, useContext } from 'react';
import Resizable from '@components/Resizable';
import clsx from 'clsx';

import type { OutlineItem } from '@domain/model/material/editable/EditablePdf';
import context from './Context';

const OutlineItemView = observer(function OutlineItemView({
  item: { title, children, key },
  level,
}: {
  item: OutlineItem;
  level: number;
}) {
  const { pdfViewer } = useContext(context);
  const dest = pdfViewer?.editor.getOutlineDest(key);

  return (
    <div style={{ paddingLeft: level * 5 }} className="mb-2">
      <div
        onClick={() => dest && pdfViewer?.jumpTo(dest)}
        className={clsx('mb-2 text-sm', dest ? 'cursor-pointer' : '')}
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

  let content: ReactNode = null;
  const outline = pdfViewer?.editor.outline;

  if (!outline) {
    content = '加载中...';
  } else {
    content =
      outline.length > 0 ? outline.map((item) => <OutlineItemView level={1} item={item} key={item.key} />) : '无提纲';
  }

  return (
    <Resizable resizable="right" initialWidth={300} className="h-full overflow-auto">
      {content}
    </Resizable>
  );
});
