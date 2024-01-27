import { observer } from 'mobx-react-lite';
import { useRef, useContext } from 'react';
import { useKeyPress } from 'ahooks';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';

import Button from '@web/components/Button';
import context from '../Context';
import PdfViewer from '../PdfViewer';

export default observer(function PageSwitcher() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    editor: { viewer },
  } = useContext(context);

  useKeyPress(
    'enter',
    (e) => {
      if (!e.target || !PdfViewer.is(viewer)) {
        return null;
      }
      viewer.jumpTo(Number((e.target as HTMLInputElement).value));
    },
    { target: inputRef },
  );

  if (!PdfViewer.is(viewer)) {
    return null;
  }

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2  -translate-y-1/2">
      <Button disabled={viewer.currentPage === 1} size="small" onClick={viewer.goToPreviousPage}>
        <ArrowLeftOutlined />
      </Button>
      <span className="px-2 text-sm">
        <input
          className="w-12"
          type="number"
          onChange={(e) => viewer.jumpTo(Number(e.target.value))}
          value={viewer.currentPage}
          ref={inputRef}
        />
        /{viewer.totalPage}
      </span>
      <Button disabled={viewer.currentPage === viewer.totalPage} size="small" onClick={viewer.goToPreviousPage}>
        <ArrowRightOutlined />
      </Button>
    </div>
  );
});
