/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import { reaction, when } from 'mobx';
import debounce from 'lodash/debounce';

import { Events, type BodyEvent } from 'model/note/Editor';
import type NoteEditor from 'model/note/Editor';
import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  const editorRef = useRef<EditorRef>(null);
  const onChange = useCallback(
    (content: string) => {
      editor.updateBody(content, true);
    },
    [editor],
  );

  useEffect(() => {
    const updateContent = debounce((body: BodyEvent) => {
      editorRef.current!.updateContent(body, true);
    }, 300);

    const stopWatchReadonly = reaction(
      () => editor.entity?.metadata.isReadonly,
      (isReadonly) => {
        if (typeof isReadonly === 'boolean') {
          editorRef.current!.setReadonly(isReadonly);

          if (!isReadonly) {
            editorRef.current!.focus();
          }
        }
      },
      { fireImmediately: true },
    );

    const stopUpdateContent = when(
      () => Boolean(editor.entity),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        editorRef.current!.updateContent(editor.entity!.body, true);
      },
    );

    editor.on(Events.BodyUpdatedNotOriginally, updateContent);

    return () => {
      editor.off(Events.BodyUpdatedNotOriginally, updateContent);
      stopWatchReadonly();
      stopUpdateContent();
    };
  }, [editor]);

  return (
    <div className="min-h-0 grow px-4">
      <MarkdownEditor ref={editorRef} onChange={onChange} />
    </div>
  );
});
