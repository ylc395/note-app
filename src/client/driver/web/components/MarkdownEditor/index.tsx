import { useRef } from 'react';
import { useDeepCompareEffect } from 'ahooks';

import Editor, { type Options } from './Editor';

// eslint-disable-next-line mobx/missing-observer
export default function MarkdownEditor(options: Omit<Options, 'root'>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);

  useDeepCompareEffect(() => {
    if (!rootRef.current) {
      throw new Error('no root');
    }

    const editor = new Editor({
      ...options,
      root: rootRef.current,
    });

    editorRef.current = editor;

    return () => editor.destroy();
  }, [options]);

  return (
    <div
      className="relative h-full select-text overflow-auto"
      onClick={() => editorRef.current?.focus()}
      ref={rootRef}
      spellCheck={false}
    ></div>
  );
}
