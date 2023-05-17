import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import type PdfEditor from 'model/material/PdfEditor';
import PdfViewer from 'web/infra/PdfViewer';

import usePopper from './usePopper';
import Toolbar from './Toolbar';
import MarkTooltip from './MarkTooltip';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const [pdfViewer, setPdfViewer] = useState<PdfViewer | null>(null);
  const { setPopperElement, update: updatePopper, hide: hidePopper, styles, attributes } = usePopper();

  useEffect(() => {
    if (!editor.entity || !containerElRef.current || !viewerElRef.current) {
      return;
    }

    const core = new PdfViewer({
      container: containerElRef.current,
      viewer: viewerElRef.current,
      onTextSelected: updatePopper,
      onTextSelectCancel: hidePopper,
    });

    core.load(editor.entity.blob.slice(0));
    setPdfViewer(core);

    return () => {
      core.destroy();
      hidePopper();
    };
  }, [editor.entity, hidePopper, updatePopper]);

  return (
    <div className="flex h-full w-full">
      <div className="relative h-full grow">
        <Toolbar pdfViewer={pdfViewer} />
        <div className="absolute inset-x-0 top-11 bottom-0 overflow-auto" ref={containerElRef}>
          <div className="select-text" ref={viewerElRef}></div>
          <div className="z-10" ref={setPopperElement} hidden style={styles.popper} {...attributes.popper}>
            <MarkTooltip pdfViewer={pdfViewer} />
          </div>
        </div>
      </div>
      <div>批注列表</div>
    </div>
  );
});
