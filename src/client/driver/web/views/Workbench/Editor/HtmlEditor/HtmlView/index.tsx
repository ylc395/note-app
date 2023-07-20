import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useContext } from 'react';

import type HtmlEditorView from 'model/material/view/HtmlEditorView';
import HtmlViewer from './HtmlViewer';
import context from '../Context';

export default observer(function HtmlView({ editorView }: { editorView: HtmlEditorView }) {
  const shadowWrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const { setHtmlViewer } = useContext(context);

  useEffect(() => {
    const htmlViewer = new HtmlViewer({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      rootEl: shadowWrapperRef.current!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      editorRootEl: editorRootRef.current!,
      editorView,
      // onTextSelected: showSelectionTooltip,
      // onTextSelectCancel: hideSelectionTooltip,
    });

    setHtmlViewer(htmlViewer);

    return () => htmlViewer.destroy();
  }, [editorView, setHtmlViewer]);

  return (
    <div className="grow overflow-auto" ref={editorRootRef}>
      <div className="all-initial">
        <div className="h-full select-text" ref={shadowWrapperRef}></div>
      </div>
      {editorView.editor.annotations.length > 0 && <div className="relative"></div>}
      {/* {selectionTooltipShowing && <SelectionTooltip ref={setSelectionTooltipPopper} style={selectionTooltipStyles} />} */}
    </div>
  );
});
