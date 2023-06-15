import { observer } from 'mobx-react-lite';
import { type ReactNode, useEffect, useContext } from 'react';
import { reaction, when } from 'mobx';
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

    const disposer = [
      reaction(
        () => editorView.editor.entity?.body,
        (body) => {
          if (typeof body === 'string' && !editorView.tile.isFocused) {
            updateContent(body);
          }
        },
      ),
      when(
        () => Boolean(editorView.editor.entity?.body),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        () => markdownEditorView.updateContent(editorView.editor.entity!.body),
      ),
      reaction(
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
      ),
    ];

    return () => {
      disposer.forEach((cb) => cb());
      updateContent.cancel();
    };
  }, [editorView, markdownEditorView]);

  return <div className="min-h-0 grow px-4">{children}</div>;
});
