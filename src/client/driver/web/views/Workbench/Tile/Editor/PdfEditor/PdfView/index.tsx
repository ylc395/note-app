import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useContext } from 'react';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import SelectionTooltip from './SelectionTooltip';
// import AnnotationLayer from './AnnotationLayer';
import AnnotationTooltip from './AnnotationTooltip';
import PdfViewer from './PdfViewer';
import Loading from './Loading';
import context from '../Context';
import './style.css';

export default observer(function PdfView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const { setPdfViewer, pdfViewer } = useContext(context);
  const isLoading = pdfViewer?.status !== 'loaded';

  useEffect(() => {
    if (!containerElRef.current || !viewerElRef.current) {
      return;
    }

    const pdfViewer = new PdfViewer({
      editor,
      container: containerElRef.current,
      viewer: viewerElRef.current,
    });

    setPdfViewer(pdfViewer);

    return () => pdfViewer.destroy();
  }, [editor, setPdfViewer]);

  return (
    <div className="relative grow overflow-hidden">
      <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
        <div className="select-text" ref={viewerElRef}></div>
        {/* <div>
          {pdfViewer?.visiblePages.map((page) => (
            <AnnotationLayer key={page} page={page} />
          ))}
        </div> */}
      </div>
      <SelectionTooltip />
      <AnnotationTooltip />
      {isLoading && <Loading />}
    </div>
  );
});
