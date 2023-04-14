/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect } from 'react';
import { reaction, when } from 'mobx';
import debounce from 'lodash/debounce';

import { Events, type BodyEvent } from 'model/note/Editor';
import type NoteEditor from 'model/note/Editor';
import type { EditorRef } from 'web/components/MarkdownEditor';

export default observer(function NoteEditor({
  editor,
  children,
  editorRef,
}: {
  editor: NoteEditor;
  children: ReactNode;
  editorRef: EditorRef | null;
}) {
  useEffect(() => {
    if (!editorRef) {
      return;
    }

    const updateContent = debounce((body: BodyEvent) => {
      editorRef.updateContent(body, true);
    }, 300);

    const stopWatchReadonly = reaction(
      () => editor.entity?.metadata.isReadonly,
      (isReadonly) => {
        if (typeof isReadonly === 'boolean') {
          editorRef.setReadonly(isReadonly);

          if (!isReadonly) {
            editorRef.focus();
          }
        }
      },
      { fireImmediately: true },
    );

    const stopUpdateContent = when(
      () => Boolean(editor.entity),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        editorRef.updateContent(editor.entity!.body, true);
      },
    );

    editor.on(Events.BodyUpdatedNotOriginally, updateContent);

    return () => {
      editor.off(Events.BodyUpdatedNotOriginally, updateContent);
      stopWatchReadonly();
      stopUpdateContent();
    };
  }, [editor, editorRef]);

  return <div className="min-h-0 grow px-4">{children}</div>;
});
