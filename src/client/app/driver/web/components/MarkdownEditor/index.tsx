import { useRef, useEffect, useState } from 'react';

import Editor, { type Options as EditorOptions } from './Editor';
import assert from 'assert';

interface Options {
  onChange?: EditorOptions['onChange'];
  onUIStateChange?: EditorOptions['onUIStateChange'];
  onBlur?: EditorOptions['onBlur'];
  onFocus?: EditorOptions['onFocus'];
  initialUIState?: EditorOptions['initialUIState'];
  autoFocus?: boolean;
  readonly?: boolean;
  searchEnabled?: boolean;
  initialContent?: string;
  content?: string;
}

// eslint-disable-next-line mobx/missing-observer
export default (function MarkdownEditor(options: Options) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const { onChange, onUIStateChange, onBlur, onFocus, autoFocus, readonly, searchEnabled, initialContent, content } =
    options;

  useEffect(() => {
    assert(rootRef.current);

    const editor: Editor = new Editor({
      root: rootRef.current,
      defaultValue: initialContent,
      autoFocus,
      onChange,
      onUIStateChange,
      onBlur,
      onFocus,
      initialUIState: options.initialUIState,
      onReady: () => setEditor(editor),
    });

    return () => {
      editor.destroy();
      setEditor(null);
    };
    // ignore 'initialContent' changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, onUIStateChange, onBlur, onFocus, autoFocus]);

  useEffect(() => {
    typeof content === 'string' && editor?.setContent(content);
  }, [content, editor]);

  useEffect(() => {
    editor?.setReadonly(readonly || false);
  }, [readonly, editor]);

  useEffect(() => {
    editor?.toggleSearch(searchEnabled);
  }, [editor, searchEnabled]);

  return (
    <div
      className="relative h-full select-text overflow-auto"
      onClick={editor?.focus}
      ref={rootRef}
      spellCheck={false}
    ></div>
  );
});
