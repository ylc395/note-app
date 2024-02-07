import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useRef } from 'react';
import { autoUpdate, offset, useFloating } from '@floating-ui/react';
import assert from 'assert';

import context from '../Context';
import PdfViewer from '../PdfViewer';

export default observer(function BodyEditor() {
  const { editor } = useContext(context);
  assert(editor.viewer instanceof PdfViewer);

  const { commentArea } = editor.viewer.annotationManager;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const reference = commentArea.selection?.markEl;

  const { refs, floatingStyles } = useFloating({
    elements: { reference },
    whileElementsMounted: autoUpdate,
    placement: commentArea.selection?.markElPosition || 'bottom',
    middleware: [offset(10)],
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reference]);

  if (!reference) {
    return null;
  }

  return (
    <div className="z-10" ref={refs.setFloating} style={floatingStyles}>
      <textarea
        value={commentArea.content}
        onChange={(e) => commentArea.updateContent(e.target.value)}
        ref={textareaRef}
      />
      <div>
        <button onClick={commentArea.submit}>确认</button>
        <button onClick={commentArea.close}>取消</button>
      </div>
    </div>
  );
});
