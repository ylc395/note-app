import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect, useContext } from 'react';
import { reaction } from 'mobx';
import debounce from 'lodash/debounce';

import EditorContext from './Context';

export default observer(function NoteEditor({ children }: { children: ReactNode }) {
  const { editorView, markdownEditorView } = useContext(EditorContext);
  useEffect(() => {
    if (!markdownEditorView) {
      return;
    }

    const updateContent = debounce((content: string) => {
      markdownEditorView.updateContent(content);
    }, 300);

    const stopWatchReadonly = reaction(
      () => editorView.editor.entity?.metadata.isReadonly,
      (isReadonly) => {
        if (typeof isReadonly === 'boolean') {
          markdownEditorView.setReadonly(isReadonly);

          if (!isReadonly) {
            markdownEditorView.focus();
          }
        }
      },
      { fireImmediately: true },
    );

    const stopUpdateContent = reaction(
      () => editorView.editor.entity?.body,
      (body) => {
        if (typeof body === 'string' && !editorView.isActive) {
          updateContent(body);
        }
      },
      { fireImmediately: true },
    );

    return () => {
      stopWatchReadonly();
      stopUpdateContent();
      updateContent.cancel();
    };
  }, [editorView, markdownEditorView]);

  return <div className="min-h-0 grow px-4">{children}</div>;
});
