import { observer } from 'mobx-react-lite';
import { Button, InputNumber } from 'antd';
import { useRef, useContext } from 'react';
import { useKeyPress } from 'ahooks';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';

import context from '../Context';

export default observer(function PageSwitcher() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { pdfViewer } = useContext(context);

  useKeyPress(
    'enter',
    (e) => {
      if (!e.target) {
        return null;
      }

      pdfViewer?.jumpToPage(Number((e.target as HTMLInputElement).value));
    },
    { target: inputRef },
  );

  return (
    <div className="absolute left-1/2 top-1/2 -translate-y-1/2  -translate-x-1/2">
      <Button
        icon={<ArrowLeftOutlined />}
        type="text"
        disabled={pdfViewer?.page.current === 1}
        size="small"
        onClick={() => pdfViewer?.goToPreviousPage()}
      ></Button>
      <span className="px-2 text-sm">
        {pdfViewer && (
          <InputNumber size="small" className="w-12" controls={false} value={pdfViewer.page.current} ref={inputRef} />
        )}{' '}
        /{pdfViewer?.page.total || 0}
      </span>
      <Button
        icon={<ArrowRightOutlined />}
        size="small"
        type="text"
        disabled={pdfViewer?.page.current === pdfViewer?.page.total}
        onClick={() => pdfViewer?.goToNextPage()}
      ></Button>
    </div>
  );
});
