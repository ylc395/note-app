import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import type PdfEditor from 'model/material/PdfEditor';
import PdfViewer from 'web/views/Workbench/Editor/PdfEditor/PdfViewer';

import useHighlightTooltip from './useHighlightTooltip';
import Toolbar from './Toolbar';
import HighlightTooltip from './HighlightTooltip';
import AnnotationLayer from './AnnotationLayer';
import HighlightList from './HighlightList';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const [pdfViewer, setPdfViewer] = useState<PdfViewer | null>(null);
  const { setPopperElement, show: showPopper, hide: hidePopper, styles, attributes } = useHighlightTooltip(pdfViewer);

  useEffect(() => {
    if (!editor.entity || !containerElRef.current || !viewerElRef.current) {
      return;
    }

    const core = new PdfViewer({
      editor,
      container: containerElRef.current,
      viewer: viewerElRef.current,
      onTextSelected: showPopper.run,
      onTextSelectCancel: () => hidePopper.current(),
    });

    setPdfViewer(core);

    return () => {
      core.destroy();
      showPopper.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopper.run, showPopper.cancel, editor.entity]);

  return (
    <div className="flex h-full w-full">
      <div className="flex h-full grow flex-col">
        <Toolbar pdfViewer={pdfViewer} />
        <div className="relative grow">
          <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
            <div className="select-text" ref={viewerElRef}></div>
            {pdfViewer &&
              pdfViewer.visiblePages.map((page) => <AnnotationLayer key={page} page={page} pdfViewer={pdfViewer} />)}
          </div>
          <HighlightTooltip
            ref={setPopperElement}
            pdfViewer={pdfViewer}
            style={styles.popper}
            attributes={attributes.popper}
          />
        </div>
      </div>
      <HighlightList editor={editor} />
    </div>
  );
});
