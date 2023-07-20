import { observer } from 'mobx-react-lite';
import { useEffect, useContext, useCallback } from 'react';
import { reaction, when } from 'mobx';
import debounce from 'lodash/debounce';

import MarkdownEditor from 'web/components/MarkdownEditor';
import EditorContext from './Context';

export default observer(function NoteEditor() {
  const { editorView, markdownEditor, setMarkdownEditor } = useContext(EditorContext);
  const onChange = useCallback((content: string) => editorView.editor.updateBody(content), [editorView]);

  useEffect(() => {
    if (!markdownEditor?.isReady) {
      return;
    }

    const updateContent = debounce((content: string) => {
      markdownEditor.updateContent(content);
    }, 300);

    const disposer = [
      when(
        () => Boolean(editorView.editor.entity?.body),
        () => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          markdownEditor.updateContent(editorView.editor.entity!.body);
          markdownEditor.applyState(editorView.state);
        },
      ),
      reaction(
        () => editorView.editor.entity?.body,
        (body) => {
          if (typeof body === 'string' && !editorView.tile.isFocused) {
            updateContent(body);
          }
        },
      ),
      reaction(
        () => editorView.editor.entity?.metadata.isReadonly,
        (isReadonly) => {
          if (typeof isReadonly === 'undefined') {
            return;
          }

          markdownEditor.setReadonly(isReadonly);

          if (!isReadonly) {
            markdownEditor.focus();
          }
        },
        { fireImmediately: true },
      ),
    ];

    return () => {
      disposer.forEach((cb) => cb());
      updateContent.cancel();
    };
  }, [editorView, markdownEditor, setMarkdownEditor]);

  return (
    <div className="min-h-0 grow px-4">
      <MarkdownEditor onInitialized={setMarkdownEditor} onChange={onChange} onUIStateChange={editorView.updateState} />
    </div>
  );
});
