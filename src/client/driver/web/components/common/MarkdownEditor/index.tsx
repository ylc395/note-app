import { forwardRef, useImperativeHandle } from 'react';

interface MilkdownProps {
  content?: string;
  onChange: (markdown: string) => void;
}

export interface MilkdownRef {
  update: (markdown: string) => void;
}

export default forwardRef<MilkdownRef, MilkdownProps>(function Milkdown({ content, onChange }, ref) {
  return (
    <textarea disabled={typeof content === 'undefined'} value={content} onChange={(e) => onChange(e.target.value)} />
  );
});
