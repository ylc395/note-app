import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useCreation } from 'ahooks';

import Editor, { type Options as EditorOptions } from './Editor';
import { IS_DEV } from '@shared/domain/infra/constants';

interface Options {
  onChange?: EditorOptions['onChange'];
  onUIStateChange?: EditorOptions['onUIStateChange'];
  initialUIState?: EditorOptions['initialUIState'];
  autoFocus?: boolean;
  readonly?: boolean;
  searchEnabled?: boolean;
  initialContent?: string;
  content?: string;
}

export type EditorRef = Pick<Editor, 'focus'>;

// eslint-disable-next-line mobx/missing-observer
export default forwardRef<EditorRef, Options>(function MarkdownEditor(options, ref) {
  const { onChange, onUIStateChange, autoFocus, initialContent, initialUIState } = options;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editor = useCreation(
    () =>
      new Editor({
        defaultValue: initialContent,
        onChange,
        autoFocus,
        onUIStateChange,
        initialUIState,
      }),
    [onChange, onUIStateChange],
  );

  useImperativeHandle(ref, () => editor, [editor]);

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
      {IS_DEV && <span className="absolute right-0 top-0">{editor.id}</span>}
    </>
  );
});
