import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { useMemoizedFn } from 'ahooks';

import MarkdownEditor from '@components/MarkdownEditor';
import EditorContext from './Context';

export default observer(function Body() {
  const ctx = useContext(EditorContext);
  const { editor } = ctx;
  const onChange = useMemoizedFn((content: string) => editor.isFocused && editor.updateBody(content));

  return (
    <div className="min-h-0 grow px-4">
      {typeof editor.body === 'string' && (
        <MarkdownEditor
          autoFocus
          initialContent={editor.body}
          initialUIState={editor.uiState || undefined}
          content={editor.isFocused ? undefined : editor.body}
          readonly={editor.isReadonly}
          onChange={onChange}
          onFocus={editor.focus}
          onBlur={editor.blur}
          onUIStateChange={editor.saveUIState}
        />
      )}
    </div>
  );
});
