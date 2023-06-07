import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useEffect, useRef, useContext } from 'react';

import type PdfEditor from 'model/material/PdfEditor';
import SelectionTooltip from './SelectionTooltip';
import useSelectionTooltip from './SelectionTooltip/useTooltip';
import AnnotationLayer from './AnnotationLayer';
import PdfViewer from './PdfViewer';
import context from '../Context';
import './style.css';

export default observer(function PdfView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const ctx = useContext(context);

  const {
    setFloating: setSelectionTooltipPopper,
    styles: selectionTooltipStyles,
    open: selectionTooltipShowing,
  } = useSelectionTooltip();

  useEffect(() => {
    const pdfViewer = new PdfViewer({
      editor,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      container: containerElRef.current!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      viewer: viewerElRef.current!,
    });

    runInAction(() => {
      ctx.pdfViewer = pdfViewer;
    });

    return () => pdfViewer.destroy();
  }, [ctx, editor]);

  return (
    <div className="relative grow overflow-hidden">
      <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
        <div className="select-text" ref={viewerElRef}></div>
        {ctx.pdfViewer && ctx.pdfViewer.annotationPages.map((page) => <AnnotationLayer key={page} page={page} />)}
      </div>
      {selectionTooltipShowing && <SelectionTooltip ref={setSelectionTooltipPopper} style={selectionTooltipStyles} />}
    </div>
  );
});
