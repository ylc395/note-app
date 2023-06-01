import { observer, useLocalObservable } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { observable, runInAction } from 'mobx';

import type PdfEditor from 'model/material/PdfEditor';

import Toolbar from './Toolbar';
import SelectionTooltip from './SelectionTooltip';
import useSelectionTooltip from './SelectionTooltip/useTooltip';
import AnnotationLayer from './AnnotationLayer';
import HighlightList from './HighlightList';
import PdfViewer, { Panels } from './PdfViewer';
import Context, { type EditorContext } from './Context';
import Outline from './Outline';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);

  const context = useLocalObservable<EditorContext>(
    () => ({
      pdfViewer: null,
      hoveringAnnotationId: null,
    }),
    { pdfViewer: observable.ref },
  );

  const {
    setFloating: setSelectionTooltipPopper,
    styles: selectionTooltipStyles,
    create: createSelectionTooltip,
    destroy: destroySelectionTooltip,
    showing: selectionTooltipShowing,
  } = useSelectionTooltip(context.pdfViewer);

  useEffect(() => {
    if (!editor.entity || !containerElRef.current || !viewerElRef.current) {
      return;
    }

    const core = new PdfViewer({
      editor,
      container: containerElRef.current,
      viewer: viewerElRef.current,
      onTextSelected: createSelectionTooltip,
      onTextSelectCancel: destroySelectionTooltip,
    });

    runInAction(() => {
      context.pdfViewer = core;
    });

    return () => {
      core.destroy();
      destroySelectionTooltip();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.entity, context]);

  return (
    <Context.Provider value={context}>
      <div className="flex h-full w-full">
        <div className="flex h-full grow flex-col">
          <Toolbar />
          <div className="relative flex min-h-0 grow">
            {context.pdfViewer?.panelsVisibility[Panels.Outline] && <Outline />}
            <div className="relative grow overflow-hidden">
              <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
                <div className="select-text" ref={viewerElRef}></div>
                {context.pdfViewer &&
                  context.pdfViewer.annotationPages.map((page) => <AnnotationLayer key={page} page={page} />)}
              </div>
              {selectionTooltipShowing && (
                <SelectionTooltip ref={setSelectionTooltipPopper} style={selectionTooltipStyles} />
              )}
            </div>
            {context.pdfViewer?.panelsVisibility[Panels.HighlightList] && <HighlightList />}
          </div>
        </div>
      </div>
    </Context.Provider>
  );
});