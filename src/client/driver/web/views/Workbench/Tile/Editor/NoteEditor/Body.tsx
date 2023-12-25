import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import MarkdownEditor from '@web/components/MarkdownEditor';
import EditorContext from './Context';

export default observer(function Body() {
  const ctx = useContext(EditorContext);
  const { editor } = ctx;

  return (
    <div className="min-h-0 grow px-4 relative">
      {typeof editor.body === 'string' && (
        <MarkdownEditor
          autoFocus
          initialContent={editor.body}
          initialUIState={editor.uiState || undefined}
          content={editor.isFocused ? undefined : editor.body}
          readonly={editor.isReadonly}
          onChange={editor.updateBody}
          onFocus={editor.focus}
          onBlur={editor.blur}
          onUIStateChange={editor.saveUIState}
        />
      )}
    </div>
  );
});
