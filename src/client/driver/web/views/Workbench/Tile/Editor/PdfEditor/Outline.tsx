import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import clsx from 'clsx';

import type { OutlineItem } from '@domain/app/model/material/editable/EditablePdf';
import Resizable from '@web/components/Resizable';
import context from './Context';
import PdfViewer from './PdfViewer';

const OutlineItemView = observer(function OutlineItemView({
  item: { title, children, key },
  level,
}: {
  item: OutlineItem;
  level: number;
}) {
  const { editor } = useContext(context);
  const dest = editor.getOutlineDest(key);

  return (
    <div style={{ paddingLeft: level * 5 }} className="mb-2">
      <div
        onClick={() => {
          if (dest && editor.viewer instanceof PdfViewer) {
            editor.viewer.jumpTo(dest);
          }
        }}
        className={clsx('mb-2 text-sm', Boolean(dest) && 'cursor-pointer')}
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
  const { editor } = useContext(context);
  const outline = editor.outline;

  return (
    <Resizable resizable="right" initialWidth={300} className="h-full overflow-auto">
      {outline
        ? outline.length > 0
          ? outline.map((item) => <OutlineItemView level={1} item={item} key={item.key} />)
          : '无提纲'
        : '加载中'}
    </Resizable>
  );
});
