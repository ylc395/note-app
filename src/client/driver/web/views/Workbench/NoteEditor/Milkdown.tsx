import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { ReactEditor, useEditor } from '@milkdown/react';
import { Editor, editorViewCtx, rootCtx, schemaCtx } from '@milkdown/core';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { clipboard } from '@milkdown/plugin-clipboard';
import { Slice, Fragment } from 'prosemirror-model';

import type NoteEditor from 'model/note/Editor';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  const editorRef = useRef<NoteEditor | undefined>();

  const { editor: milkdownEditor } = useEditor(
    (root) =>
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.get(listenerCtx).updated((_, doc, pre) => {
            if (pre && editorRef.current) {
              editorRef.current.updateBody(doc.toJSON());
            }
          });
        })
        .use(gfm)
        .use(clipboard)
        .use(listener),
    [],
  );

  useEffect(() => {
    const e = milkdownEditor.editor.current;

    if (!e) {
      return;
    }

    e.action((ctx) => {
      if (editor === editorRef.current || !editor || typeof editor.entity?.body !== 'string') {
        return;
      }

      editorRef.current = undefined;

      const view = ctx.get(editorViewCtx);
      const schema = ctx.get(schemaCtx);
      const state = view.state;
      const slice = new Slice(
        Fragment.fromJSON(schema, editor.entity.body ? [JSON.parse(editor.entity.body)] : []),
        0,
        0,
      );

      view.dispatch(state.tr.replace(0, state.doc.content.size, slice));
      editorRef.current = editor;
    });
  }, [editor, editor.entity?.body, milkdownEditor.editor]);

  return (
    <div className="px-4 overflow-auto">
      <ReactEditor editor={milkdownEditor} />
    </div>
  );
});
