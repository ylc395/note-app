import { useRef, useEffect, useState } from 'react';

import Editor, { type Options as EditorOptions } from './Editor';

interface Options {
  onChange?: (content: string) => void;
  onUIStateChange?: EditorOptions['onUIStateChange'];
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
  const { onChange, onUIStateChange, autoFocus, readonly, searchEnabled, initialContent, content } = options;

  useEffect(() => {
    if (!rootRef.current) {
      throw new Error('no root');
    }

    const editor: Editor = new Editor({
      root: rootRef.current,
      defaultValue: initialContent,
      autoFocus,
      onChange,
      onUIStateChange,
      onReady: () => setEditor(editor),
    });

    console.debug(`create editor-${editor.id}`);

    return () => {
      editor.destroy();
      setEditor(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, onUIStateChange]);

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
      onClick={() => editor?.focus()}
      ref={rootRef}
      spellCheck={false}
    ></div>
  );
});
