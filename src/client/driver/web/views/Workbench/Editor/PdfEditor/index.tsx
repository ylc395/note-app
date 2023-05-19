import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import type PdfEditor from 'model/material/PdfEditor';
import PdfViewer from 'web/views/Workbench/Editor/PdfEditor/PdfViewer';

import useHighlightTooltip from './useHighlightTooltip';
import Toolbar from './Toolbar';
import HighlightTooltip from './HighlightTooltip';

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
      materialId: editor.entityId,
      container: containerElRef.current,
      viewer: viewerElRef.current,
      onTextSelected: showPopper.run,
      onTextSelectCancel: () => hidePopper.current(),
    });

    core.load(editor.entity.blob.slice(0));
    setPdfViewer(core);

    return () => {
      core.destroy();
      showPopper.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.entity, hidePopper, showPopper.run, showPopper.cancel]);

  return (
    <div className="flex h-full w-full">
      <div className="relative h-full grow">
        <Toolbar pdfViewer={pdfViewer} />
        <div className="absolute inset-x-0 top-11 bottom-0 overflow-auto" ref={containerElRef}>
          <div className="select-text" ref={viewerElRef}></div>
          <div
            className="pdf-editor-tooltip z-10"
            ref={setPopperElement}
            hidden
            style={styles.popper}
            {...attributes.popper}
          >
            <HighlightTooltip pdfViewer={pdfViewer} />
          </div>
        </div>
      </div>
      <div>批注列表</div>
    </div>
  );
});
