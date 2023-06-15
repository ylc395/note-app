import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useContext } from 'react';

import type PdfEditorView from 'model/material/PdfEditorView';
import SelectionTooltip from './SelectionTooltip';
import AnnotationLayer from './AnnotationLayer';
import AnnotationTooltip from './AnnotationTooltip';
import PdfViewer from './PdfViewer';
import context from '../Context';
import './style.css';

export default observer(function PdfView({ editorView }: { editorView: PdfEditorView }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const { setPdfViewer, pdfViewer } = useContext(context);

  useEffect(() => {
    const pdfViewer = new PdfViewer({
      editorView,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      container: containerElRef.current!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      viewer: viewerElRef.current!,
    });

    setPdfViewer(pdfViewer);

    return () => pdfViewer.destroy();
  }, [editorView, setPdfViewer]);

  return (
    <div className="relative grow overflow-hidden">
      <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
        <div className="select-text" ref={viewerElRef}></div>
        <div>
          {pdfViewer?.pagesWithAnnotation.map((page) => (
            <AnnotationLayer key={page} page={page} />
          ))}
        </div>
      </div>
      <SelectionTooltip />
      <AnnotationTooltip />
    </div>
  );
});
