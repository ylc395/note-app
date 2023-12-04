import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useContext } from 'react';

import type HtmlEditor from '@domain/model/material/editor/HtmlEditor';
import HtmlViewer from './HtmlViewer';
import context from '../Context';

export default observer(function HtmlView({ editor }: { editor: HtmlEditor }) {
  const shadowWrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const { setHtmlViewer } = useContext(context);

  useEffect(() => {
    const htmlViewer = new HtmlViewer({
      rootEl: shadowWrapperRef.current!,
      editorRootEl: editorRootRef.current!,
      editor,
      // onTextSelected: showSelectionTooltip,
      // onTextSelectCancel: hideSelectionTooltip,
    });

    setHtmlViewer(htmlViewer);

    return () => htmlViewer.destroy();
  }, [editor, setHtmlViewer]);

  return (
    <div className="grow overflow-auto" ref={editorRootRef}>
      <div className="all-initial">
        <div className="h-full select-text" ref={shadowWrapperRef}></div>
      </div>
      {editor.annotations.length > 0 && <div className="relative"></div>}
      {/* {selectionTooltipShowing && <SelectionTooltip ref={setSelectionTooltipPopper} style={selectionTooltipStyles} />} */}
    </div>
  );
});
