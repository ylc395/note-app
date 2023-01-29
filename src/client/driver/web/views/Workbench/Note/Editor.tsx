import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { ReactEditor, useEditor } from '@milkdown/react';
import { Editor, editorViewCtx, rootCtx, schemaCtx } from '@milkdown/core';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { Slice, Fragment } from 'prosemirror-model';

import type NoteEditorModel from 'model/editor/NoteEditor';

export default observer(function NoteEditor({ editor }: { editor: NoteEditorModel }) {
  const { editor: milkdownEditor } = useEditor(
    (root) =>
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.get(listenerCtx).updated((ctx, doc) => {
            editor.updateNoteBody(doc.toJSON());
          });
        })
        .use(gfm)
        .use(listener),
    [editor],
  );

  useEffect(() => {
    const e = milkdownEditor.editor.current;
    const body = editor.noteBody;

    if (e && body) {
      e.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const schema = ctx.get(schemaCtx);
        const state = view.state;
        view.dispatch(
          state.tr.replace(0, state.doc.content.size, new Slice(Fragment.fromJSON(schema, [JSON.parse(body)]), 0, 0)),
        );
      });
    }
  }, [editor.noteBody, milkdownEditor.editor]);

  return <ReactEditor editor={milkdownEditor} />;
});
