import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useContext } from 'react';

import type PdfEditorView from 'model/material/view/PdfEditorView';
import SelectionTooltip from './SelectionTooltip';
import AnnotationLayer from './AnnotationLayer';
import AnnotationTooltip from './AnnotationTooltip';
import PdfViewer from './PdfViewer';
import Loading from './Loading';
import context from '../Context';
import './style.css';

export default observer(function PdfView({ editorView }: { editorView: PdfEditorView }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const { setPdfViewer, pdfViewer } = useContext(context);
  const isLoading = pdfViewer?.status !== 'loaded';

  useEffect(() => {
    if (!containerElRef.current || !viewerElRef.current) {
      return;
    }

    const pdfViewer = new PdfViewer({
      editorView,
      container: containerElRef.current,
      viewer: viewerElRef.current,
    });

    setPdfViewer(pdfViewer);

    return () => pdfViewer.destroy();
  }, [editorView, setPdfViewer]);

  return (
    <div className="relative grow overflow-hidden">
      <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
        <div className="select-text" ref={viewerElRef}></div>
        <div>
          {pdfViewer?.visiblePages.map((page) => (
            <AnnotationLayer key={page} page={page} />
          ))}
        </div>
      </div>
      <SelectionTooltip />
      <AnnotationTooltip />
      {isLoading && <Loading />}
    </div>
  );
});
