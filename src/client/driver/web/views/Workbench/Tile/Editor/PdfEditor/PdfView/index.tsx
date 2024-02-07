import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { runInAction } from 'mobx';
import { AiFillHighlight, AiOutlineComment } from 'react-icons/ai';

import PdfEditor from '@domain/app/model/material/editor/PdfEditor';
import PdfViewer from '../PdfViewer';
import SelectionTooltip from '../../common/SelectionTooltip';
import Loading from './Loading';
import AnnotationLayer from './AnnotationLayer';
import CommentArea from './CommentArea';
import './style.css';

export default observer(function PdfView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);
  const [pdfViewer, setPdfViewer] = useState<PdfViewer>();
  const reference = pdfViewer?.annotationManager.currentSelection?.markEl;
  const placement = pdfViewer?.annotationManager.currentSelection?.markElPosition;

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
      </div>
      {pdfViewer instanceof PdfViewer && (
        <>
          <div>
            {pdfViewer.annotationManager.pages.map((page) => (
              <AnnotationLayer key={page} page={page} />
            ))}
          </div>
          {reference && (
            <SelectionTooltip
              reference={reference}
              placement={placement}
              buttons={[
                {
                  icon: <AiFillHighlight />,
                  onClick: () => pdfViewer.annotationManager.createAnnotation({ color: 'yellow' }),
                },
                { icon: <AiOutlineComment />, onClick: pdfViewer.annotationManager.commentArea.open },
              ]}
            />
          )}
          <CommentArea />
          {!pdfViewer.isReady && <Loading />}
        </>
      )}
    </div>
  );
});
