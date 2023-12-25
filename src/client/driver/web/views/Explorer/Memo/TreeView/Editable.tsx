import { Button } from 'antd';
import { useRef } from 'react';

import MarkdownEditor from '@web/components/MarkdownEditor';

interface Props {
  onCancel: () => void;
  onSubmit: (content: string) => void;
  content?: string;
  isEditing: boolean;
}

// eslint-disable-next-line mobx/missing-observer
export default function ChildEditor({ onCancel, onSubmit, content, isEditing }: Props) {
  const contentRef = useRef(content);
  const _onSubmit = () => {
    onSubmit(contentRef.current!);
  };

  return (
    <div>
      <div className="h-16 text-sm">
        <MarkdownEditor
          readonly={!isEditing}
          initialContent={content}
          autoFocus
          onChange={(e) => (contentRef.current = e)}
        />
      </div>
      {isEditing && (
        <div>
          <Button onClick={onCancel}>取消</Button>
          <Button onClick={_onSubmit}>提交</Button>
        </div>
      )}
    </div>
  );
}
