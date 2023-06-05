import { observer } from 'mobx-react-lite';
import { useRef, useEffect } from 'react';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlViewer';

export default observer(function HtmlView({ editor }: { editor: HtmlEditor }) {
  const shadowWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const htmlViewer = new HtmlViewer({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      rootEl: shadowWrapperRef.current!,
      editor,
    });

    return () => htmlViewer.destroy();
  }, [editor]);

  return (
    <div className="h-full overflow-auto">
      <div className="all-initial">
        <div className="select-text" ref={shadowWrapperRef}></div>
      </div>
    </div>
  );
});
