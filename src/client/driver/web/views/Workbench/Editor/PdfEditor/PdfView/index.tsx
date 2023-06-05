import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useEffect, useRef, useContext } from 'react';

import type PdfEditor from 'model/material/PdfEditor';
import SelectionTooltip from './SelectionTooltip';
import useSelectionTooltip from './SelectionTooltip/useTooltip';
import AnnotationLayer from './AnnotationLayer';
import PdfViewerVM from './PdfViewer';
import context from '../Context';
import './style.css';

export default observer(function PdfViewer({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const ctx = useContext(context);

  const {
    setFloating: setSelectionTooltipPopper,
    styles: selectionTooltipStyles,
    create: createSelectionTooltip,
    destroy: destroySelectionTooltip,
    showing: selectionTooltipShowing,
  } = useSelectionTooltip(ctx.pdfViewer);

  useEffect(() => {
    if (!editor.entity || !containerElRef.current || !viewerElRef.current) {
      return;
    }

    const core = new PdfViewerVM({
      editor,
      container: containerElRef.current,
      viewer: viewerElRef.current,
      onTextSelected: createSelectionTooltip,
      onTextSelectCancel: destroySelectionTooltip,
    });

    runInAction(() => {
      ctx.pdfViewer = core;
    });

    return () => {
      core.destroy();
      destroySelectionTooltip();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.entity, ctx]);

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
