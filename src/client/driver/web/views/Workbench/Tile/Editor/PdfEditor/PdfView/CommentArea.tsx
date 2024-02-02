import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useRef, useState } from 'react';
import { autoUpdate, offset, useFloating } from '@floating-ui/react';
import assert from 'assert';

import context from '../Context';
import PdfViewer from '../PdfViewer';
import PageOverlay from './PageOverlay';

export default observer(function CommentArea() {
  const { editor } = useContext(context);
  const [value, setValue] = useState('');
  assert(editor.viewer instanceof PdfViewer);

  const { commentArea } = editor.viewer;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const reference = commentArea.selection?.markEl;

  const { refs, floatingStyles } = useFloating({
    elements: { reference },
    whileElementsMounted: autoUpdate,
    placement: commentArea.selection?.markElPosition || 'bottom',
    middleware: [offset(10)],
  });

  editor.viewer.scale.value; // read it to make it a reactive dependency

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [reference]);

  return (
    reference && (
      <>
        {commentArea.pages.map((page) => (
          <PageOverlay key={page} page={Number(page)}>
            {commentArea.getRectsOfPage(page).map((f, i) => (
              <mark
                key={i}
                className="absolute"
                style={{
                  top: f.top,
                  bottom: f.bottom,
                  left: f.left,
                  right: f.right,
                  backgroundColor: f.color,
                }}
              />
            ))}
          </PageOverlay>
        ))}
        <div className="z-10" ref={refs.setFloating} style={floatingStyles}>
          <textarea value={value} onChange={(e) => setValue(e.target.value)} ref={textareaRef}></textarea>
          <div>
            <button
              onClick={() => {
                assert(editor.viewer instanceof PdfViewer);
                editor.viewer.commentArea.submit(value);
              }}
            >
              确认
            </button>
            <button onClick={editor.viewer.commentArea.close}>取消</button>
          </div>
        </div>
      </>
    )
  );
});
