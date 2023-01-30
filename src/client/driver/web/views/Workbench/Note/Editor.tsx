import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { ReactEditor, useEditor } from '@milkdown/react';
import { Editor, editorViewCtx, rootCtx, schemaCtx } from '@milkdown/core';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { Slice, Fragment } from 'prosemirror-model';

import type Window from 'model/Window';

export default observer(function NoteEditor({ window }: { window: Window }) {
  const noteBody = window.currentTab?.type === 'note' && window.currentTab.editor?.noteBody;
  const { editor: milkdownEditor } = useEditor(
    (root) =>
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root);
          ctx.get(listenerCtx).updated((ctx, doc, pre) => {
            if (pre) {
              window?.currentTab?.editor?.save(doc.toJSON());
            }
          });
        })
        .use(gfm)
        .use(listener),
    [],
  );

  useEffect(() => {
    const e = milkdownEditor.editor.current;

    if (e && typeof noteBody === 'string') {
      e.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const schema = ctx.get(schemaCtx);
        const state = view.state;
        view.dispatch(
          state.tr.replace(
            0,
            state.doc.content.size,
            new Slice(Fragment.fromJSON(schema, noteBody ? [JSON.parse(noteBody)] : []), 0, 0),
          ),
        );
      });
    }
  }, [noteBody, milkdownEditor]);

  return <ReactEditor editor={milkdownEditor} />;
});
