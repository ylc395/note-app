import { useRef, useEffect } from 'react';
import { useCreation } from 'ahooks';

import Editor, { type Options as EditorOptions } from './Editor';
import { IS_DEV } from '@shared/domain/infra/constants';

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
  const { onChange, onUIStateChange, onBlur, onFocus, autoFocus, initialContent, initialUIState } = options;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editor = useCreation(
    () =>
      new Editor({
        defaultValue: initialContent,
        autoFocus,
        onChange,
        onUIStateChange,
        onBlur,
        onFocus,
        initialUIState,
      }),
    [onChange, onUIStateChange, onBlur, onFocus],
  );

  useEffect(() => {
    editor.mount(rootRef.current!);
    return () => {
      editor.destroy();
    };
  }, [editor]);

  useEffect(() => {
    typeof options.content === 'string' && editor.setContent(options.content);
  }, [editor, options.content]);

  useEffect(() => {
    editor.setReadonly(options.readonly || false);
  }, [editor, options.readonly]);

  useEffect(() => {
    editor.toggleSearch(options.searchEnabled || false);
  }, [editor, options.searchEnabled]);

  return (
    <>
      <div
        className="relative h-full select-text overflow-auto"
        onClick={editor?.focus}
        ref={rootRef}
        spellCheck={false}
      ></div>
      {IS_DEV && <small className="absolute right-0 top-0">{editor.id}</small>}
    </>
  );
});
