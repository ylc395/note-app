import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useContext } from 'react';
import { runInAction } from 'mobx';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlViewer';
import context from '../Context';
import HighlightElement from './HighlightElement';
import clsx from 'clsx';

export default observer(function HtmlView({ editor }: { editor: HtmlEditor }) {
  const shadowWrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const ctx = useContext(context);

  useEffect(() => {
    const htmlViewer = new HtmlViewer({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      rootEl: shadowWrapperRef.current!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      editorRootEl: editorRootRef.current!,
      editor,
    });

    runInAction(() => {
      ctx.htmlViewer = htmlViewer;
    });

    return () => htmlViewer.destroy();
  }, [editor, ctx]);

  return (
    <div className="h-full overflow-auto" ref={editorRootRef}>
      <div className="all-initial">
        <div className="select-text" ref={shadowWrapperRef}></div>
      </div>
      <div>
        {editor.highlightElements.map((el) => (
          <HighlightElement key={el.id} el={el} />
        ))}
      </div>
    </div>
  );
});
