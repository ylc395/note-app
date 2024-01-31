import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { runInAction } from 'mobx';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import AnnotationLayer from './AnnotationLayer';
// import AnnotationTooltip from './AnnotationTooltip';
import PdfViewer from '../PdfViewer';
import SelectionTooltip from '../../common/SelectionTooltip';
import Loading from './Loading';
import './style.css';

export default observer(function PdfView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const [pdfViewer, setPdfViewer] = useState<PdfViewer>();

  useEffect(() => {
    if (!containerElRef.current || !viewerElRef.current) {
      return;
    }

    const pdfViewer = new PdfViewer({
      editor,
      container: containerElRef.current,
      viewer: viewerElRef.current,
    });

    runInAction(() => {
      editor.viewer = pdfViewer;
    });
    setPdfViewer(pdfViewer);
    return () => pdfViewer.destroy();
  }, [editor]);

  return (
    <div className="relative grow overflow-hidden">
      <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
        <div className="select-text" ref={viewerElRef}></div>
        {pdfViewer?.annotationManager.pageElements.map(({ page, div }) => (
          <AnnotationLayer key={page} page={page} pageEl={div} />
        ))}
      </div>
      <SelectionTooltip
        onHighlight={(color) => pdfViewer?.annotationManager.createAnnotation({ color, body: 'test' })}
        reference={pdfViewer?.annotationManager.rangeEvent?.markEl}
        placement={pdfViewer?.annotationManager.rangeEvent?.markElPosition === 'start' ? 'top' : 'bottom'}
      />
      {/* <AnnotationTooltip /> */}
      {!pdfViewer?.isReady && <Loading />}
    </div>
  );
});
