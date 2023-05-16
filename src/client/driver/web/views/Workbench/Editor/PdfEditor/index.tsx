import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import type PdfEditor from 'model/material/PdfEditor';
import Core from './Core';

export default observer(function PdfEditorView({ editor }: { editor: PdfEditor }) {
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const viewerElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editor.entity || !containerElRef.current || !viewerElRef.current) {
      return;
    }

    const core = new Core({
      container: containerElRef.current,
      viewer: viewerElRef.current,
    });

    core.load(editor.entity.blob.slice(0));

    return () => {
      core.destroy();
    };
  }, [editor.entity]);

  return (
    <div className="absolute h-full w-full overflow-auto" ref={containerElRef}>
      <div className="select-text" ref={viewerElRef}></div>
    </div>
  );
});
