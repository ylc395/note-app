import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { useCallback, useRef } from 'react';

import MarkdownEditor from 'web/components/MarkdownEditor';

interface Props {
  onCancel: () => void;
  onSubmit: (content: string) => void;
  content?: string;
  isEditing: boolean;
}

export default observer(function ChildEditor({ onCancel, onSubmit, content, isEditing }: Props) {
  const contentRef = useRef(content);
  const _onSubmit = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    onSubmit(contentRef.current!);
  }, [onSubmit]);

  return (
    <div>
      <div className="h-16 text-sm">
        <MarkdownEditor
          readonly={!isEditing}
          defaultValue={content}
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
});
