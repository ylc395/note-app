import { observer } from 'mobx-react-lite';
import { useRef, useContext, useEffect, useState, ChangeEvent } from 'react';
import { useKeyPress } from 'ahooks';
import { AiOutlineArrowLeft, AiOutlineArrowRight } from 'react-icons/ai';

import Button from '@web/components/Button';
import context from '../Context';
import PdfViewer from '../PdfViewer';

export default observer(function PageSwitcher() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    editor: { viewer },
  } = useContext(context);
  const currentPage = viewer instanceof PdfViewer ? viewer.currentPage : 0;
  const [value, setValue] = useState('');
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  useKeyPress(
    'enter',
    (e) => {
      const num = parseInt((e.target as HTMLInputElement).value, 10);

      if (!e.target || !(viewer instanceof PdfViewer) || Number.isNaN(num)) {
        return null;
      }

      viewer.jumpTo(num);
    },
    { target: inputRef },
  );

  useEffect(() => {
    setValue(String(currentPage));
  }, [currentPage]);

  if (!(viewer instanceof PdfViewer)) {
    return null;
  }

  return (
    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2  -translate-y-1/2">
      <Button disabled={viewer.currentPage === 1} size="small" onClick={viewer.goToPreviousPage}>
        <AiOutlineArrowLeft />
      </Button>
      <span className="px-2 text-sm">
        <input ref={inputRef} className="w-12" value={value} onChange={onChange} />/{viewer.totalPage}
      </span>
      <Button disabled={viewer.currentPage === viewer.totalPage} size="small" onClick={viewer.goToNextPage}>
        <AiOutlineArrowRight />
      </Button>
    </div>
  );
});
