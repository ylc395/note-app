import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { gfm } from '@milkdown/preset-gfm';
import { commonmark } from '@milkdown/preset-commonmark';
import { Editor, rootCtx, editorViewCtx, parserCtx, EditorStatus } from '@milkdown/core';
import { Slice } from '@milkdown/prose/model';
import { listenerCtx, listener } from '@milkdown/plugin-listener';

interface Props {
  onChange: (content: string) => void; // only fire for user input
}

export interface EditorRef {
  focus: () => void;
  updateContent: (content: string) => void;
}

export default forwardRef<EditorRef, Props>(function MarkdownEditor({ onChange }, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor>();
  const isUpdating = useRef(false);

  useEffect(() => {
    if (!rootRef.current) {
      throw new Error('no root');
    }

    const editor = Editor.make()
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .config((ctx) => {
        ctx.set(rootCtx, rootRef.current);
        ctx.get(listenerCtx).markdownUpdated((_, markdown, pre) => {
          !isUpdating.current && typeof pre === 'string' && onChange(markdown);
        });
      });

    editor.create();
    editorRef.current = editor;

    return () => {
      editor.destroy();
    };
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      const editor = editorRef.current;

      if (!editor) {
        throw new Error('not init');
      }

      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);

        if (!view.hasFocus()) {
          view.focus();
        }
      });
    },
    updateContent: async (content: string) => {
      const editor = editorRef.current;

      if (!editor) {
        throw new Error('not init');
      }
      const update = () =>
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

      if (editor.status === EditorStatus.Created) {
        update();
      } else {
        editor.onStatusChange((status) => {
          if (status === EditorStatus.Created) {
            update();
          }
        });
      }
    },
  }));

  return <div ref={rootRef} spellCheck={false}></div>;
});