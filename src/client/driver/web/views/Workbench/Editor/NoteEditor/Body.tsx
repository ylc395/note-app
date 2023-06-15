import { observer } from 'mobx-react-lite';
import { useEffect, useContext, useCallback } from 'react';
import { reaction, when } from 'mobx';
import debounce from 'lodash/debounce';
import { useCreation } from 'ahooks';

import MarkdownEditor from 'web/components/MarkdownEditor';
import EditorContext from './Context';

export default observer(function NoteEditor() {
  const { editorView, markdownEditorView, setMarkdownEditorView } = useContext(EditorContext);
  const onChange = useCallback((content: string) => editorView.editor.updateBody(content), [editorView]);
  const node = useCreation(() => <MarkdownEditor ref={setMarkdownEditorView} onChange={onChange} />, [onChange]);

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

  return <div className="min-h-0 grow px-4">{node}</div>;
});
