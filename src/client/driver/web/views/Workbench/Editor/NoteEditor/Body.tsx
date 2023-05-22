import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect, useContext } from 'react';
import { reaction, when } from 'mobx';
import debounce from 'lodash/debounce';

import { Events } from 'model/note/Editor';

import EditorContext from './Context';

export default observer(function NoteEditor({ children }: { children: ReactNode }) {
  const { editor, editorView } = useContext(EditorContext);
  useEffect(() => {
    if (!editorView) {
      return;
    }

    const updateContent = debounce(({ content, isOriginal }: { content: string; isOriginal: boolean }) => {
      if (!isOriginal) {
        editorView.updateContent(content);
      }
    }, 300);

    const stopWatchReadonly = reaction(
      () => editor.entity?.metadata.isReadonly,
      (isReadonly) => {
        if (typeof isReadonly === 'boolean') {
          editorView.setReadonly(isReadonly);

          if (!isReadonly) {
            editorView.focus();
          }
        }
      },
      { fireImmediately: true },
    );

    const stopUpdateContent = when(
      () => Boolean(editor.entity),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      () => editorView.updateContent(editor.entity!.body),
    );

    editor.on(Events.BodyUpdated, updateContent);

    return () => {
      editor.off(Events.BodyUpdated, updateContent);
      stopWatchReadonly();
      stopUpdateContent();
    };
  }, [editor, editorView]);

  return <div className="min-h-0 grow px-4">{children}</div>;
});
