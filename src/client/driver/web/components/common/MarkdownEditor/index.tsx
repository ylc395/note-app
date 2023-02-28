import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { gfm } from '@milkdown/preset-gfm';
import { commonmark } from '@milkdown/preset-commonmark';
import { Editor, rootCtx, editorViewCtx, parserCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import '@milkdown/theme-nord/style.css';
import { Slice } from '@milkdown/prose/model';
import { listenerCtx, listener } from '@milkdown/plugin-listener';

interface Props {
  onChange: (content: string) => void;
}

export interface EditorRef {
  updateContent: (content: string) => void;
}

export default forwardRef<EditorRef, Props>(function MarkdownEditor({ onChange }, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor>();
  const isUpdating = useRef(false);

  useEffect(() => {
    if (!rootRef.current) {
      throw new Error('no root');
    }

    const editor = Editor.make()
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, rootRef.current);
        ctx.get(listenerCtx).markdownUpdated((_, markdown, pre) => {
          !isUpdating.current && typeof pre === 'string' && onChange(markdown);
        });
      });

    editor.create().then(setEditor);

    return () => {
      editor.destroy();
    };
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    updateContent: (content: string) => {
      if (!editor) {
        throw new Error('editor not ready');
      }

      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const parser = ctx.get(parserCtx);
        const doc = parser(content);
        const state = view.state;

        if (!doc) {
          return;
        }

        isUpdating.current = true;
        view.dispatch(state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)));
        isUpdating.current = false;
      });
    },
  }));

  return <div ref={rootRef}></div>;
});
