import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useContext } from 'react';
import { runInAction } from 'mobx';

import type HtmlEditorView from 'model/material/HtmlEditorView';
import HtmlViewer from './HtmlViewer';
import context from '../Context';
import ElementAnnotation from './ElementAnnotation';
import { AnnotationTypes } from 'interface/material';

export default observer(function HtmlView({ editorView }: { editorView: HtmlEditorView }) {
  const shadowWrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const ctx = useContext(context);

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

    runInAction(() => {
      ctx.htmlViewer = htmlViewer;
    });

    return () => htmlViewer.destroy();
  }, [editorView, ctx]);

  return (
    <div className="h-full grow overflow-auto" ref={editorRootRef}>
      <div className="all-initial">
        <div className="select-text" ref={shadowWrapperRef}></div>
      </div>
      <div className="relative">
        {editorView.editor.annotations.map((el) => {
          if (el.type === AnnotationTypes.HtmlElement) {
            return <ElementAnnotation key={el.id} el={el} />;
          }
        })}
      </div>
      {/* {selectionTooltipShowing && <SelectionTooltip ref={setSelectionTooltipPopper} style={selectionTooltipStyles} />} */}
    </div>
  );
});
