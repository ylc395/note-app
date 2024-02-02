import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useRef } from 'react';
import assert from 'assert';

import context from '../Context';
import PdfViewer from '../PdfViewer';
import { autoUpdate, offset, useFloating } from '@floating-ui/react';

export default observer(function CommentArea() {
  const { editor } = useContext(context);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const reference = editor.viewer instanceof PdfViewer ? editor.viewer.commentArea.selection?.markEl : undefined;

  assert(editor.viewer instanceof PdfViewer);

  const { refs, floatingStyles } = useFloating({
    elements: { reference },
    whileElementsMounted: autoUpdate,
    placement: editor.viewer.commentArea.selection?.markElPosition || 'bottom',
    middleware: [offset(10)],
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reference]);

  return (
    reference && (
      <div className="z-10" ref={refs.setFloating} style={floatingStyles}>
        <textarea ref={textareaRef}></textarea>
        <div>
          <button>确认</button>
          <button onClick={editor.viewer.commentArea.close}>取消</button>
        </div>
      </div>
    )
  );
});
