import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useRef, useState } from 'react';
import { autoUpdate, offset, useFloating } from '@floating-ui/react';
import assert from 'assert';

import context from '../Context';
import PdfViewer from '../PdfViewer';

export default observer(function CommentArea() {
  const { editor } = useContext(context);
  const [value, setValue] = useState('');
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
      <textarea value={value} onChange={(e) => setValue(e.target.value)} ref={textareaRef}></textarea>
      <div>
        <button onClick={() => commentArea.submit(value)}>确认</button>
        <button onClick={commentArea.close}>取消</button>
      </div>
    </div>
  );
});
