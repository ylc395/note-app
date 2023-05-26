import { observer, useLocalObservable } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { observable, runInAction } from 'mobx';

import type PdfEditor from 'model/material/PdfEditor';
import PdfViewer from 'web/views/Workbench/Editor/PdfEditor/PdfViewer';

import useHighlightTooltip from './useHighlightTooltip';
import Toolbar from './Toolbar';
import HighlightTooltip from './HighlightTooltip';
import AnnotationLayer from './AnnotationLayer';
import HighlightList from './HighlightList';
import Context, { type EditorContext } from './Context';

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
    setPopperElement,
    show: showPopper,
    hide: hidePopper,
    styles,
    attributes,
  } = useHighlightTooltip(context.pdfViewer);

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

    runInAction(() => {
      context.pdfViewer = core;
    });

    return () => {
      core.destroy();
      showPopper.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopper.run, showPopper.cancel, editor.entity]);

  return (
    <Context.Provider value={context}>
      <div className="flex h-full w-full">
        <div className="flex h-full grow flex-col">
          <Toolbar />
          <div className="relative grow">
            <div className="absolute inset-0 overflow-auto" ref={containerElRef}>
              <div className="select-text" ref={viewerElRef}></div>
              {context.pdfViewer &&
                context.pdfViewer.visiblePages.map((page) => <AnnotationLayer key={page} page={page} />)}
            </div>
            <HighlightTooltip ref={setPopperElement} style={styles.popper} attributes={attributes.popper} />
          </div>
        </div>
        <HighlightList />
      </div>
    </Context.Provider>
  );
});
