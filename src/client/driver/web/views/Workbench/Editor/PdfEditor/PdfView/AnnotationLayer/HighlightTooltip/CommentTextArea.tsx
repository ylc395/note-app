import { Input, Button } from 'antd';
import { useState } from 'react';

// eslint-disable-next-line mobx/missing-observer
export default function CommentTextArea({
  onConfirm,
  defaultValue,
}: {
  onConfirm: (v: string) => void;
  defaultValue?: string | null;
}) {
  const [value, setValue] = useState(defaultValue || '');

  return (
    <div>
      <Input.TextArea value={value} onChange={(e) => setValue(e.target.value)}></Input.TextArea>
      <div>
        <Button size="small" onClick={() => onConfirm(value)}>
          确认
        </Button>
      </div>
    </div>
  );
}
