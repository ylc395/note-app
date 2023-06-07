import { observer } from 'mobx-react-lite';
import { useRef, useEffect, useContext } from 'react';
import { runInAction } from 'mobx';

import type HtmlEditor from 'model/material/HtmlEditor';
import HtmlViewer from './HtmlViewer';
import context from '../Context';
import ElementAnnotation from './ElementAnnotation';
import { AnnotationTypes } from 'interface/material';

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
      // onTextSelected: showSelectionTooltip,
      // onTextSelectCancel: hideSelectionTooltip,
    });

    runInAction(() => {
      ctx.htmlViewer = htmlViewer;
    });

    return () => htmlViewer.destroy();
  }, [editor, ctx]);

  return (
    <div className="h-full grow overflow-auto" ref={editorRootRef}>
      <div className="all-initial">
        <div className="select-text" ref={shadowWrapperRef}></div>
      </div>
      <div>
        {editor.annotations.map((el) => {
          if (el.type === AnnotationTypes.HtmlElement) {
            return <ElementAnnotation key={el.id} el={el} />;
          }
        })}
      </div>
      {/* {selectionTooltipShowing && <SelectionTooltip ref={setSelectionTooltipPopper} style={selectionTooltipStyles} />} */}
    </div>
  );
});
