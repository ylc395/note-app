import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { useMemoizedFn } from 'ahooks';

import MarkdownEditor from 'web/components/MarkdownEditor';
import EditorContext from './Context';

export default observer(function NoteEditor() {
  const ctx = useContext(EditorContext);
  const { editor } = ctx;
  const onChange = useMemoizedFn((content: string) => editor.isFocused && editor.editable.updateBody(content));

  return (
    <div className="min-h-0 grow px-4">
      {typeof editor.editable.entity?.body === 'string' && (
        <MarkdownEditor
          autoFocus
          initialContent={editor.editable.entity.body}
          content={editor.isFocused ? undefined : editor.editable.entity.body}
          readonly={editor.editable.entity.metadata.isReadonly}
          onChange={onChange}
          onFocus={editor.setFocus}
          onBlur={editor.setBlur}
          onUIStateChange={editor.updateUIState}
        />
      )}
    </div>
  );
});
