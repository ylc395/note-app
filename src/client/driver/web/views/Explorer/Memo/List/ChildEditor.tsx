import { observer } from 'mobx-react-lite';
import { Button } from 'antd';
import { useCallback, useRef } from 'react';

import MarkdownEditor from 'web/components/MarkdownEditor';

interface Props {
  onCancel: () => void;
  onSubmit: (content: string) => void;
}

export default observer(function ChildEditor({ onCancel, onSubmit }: Props) {
  const content = useRef('');
  const _onSubmit = useCallback(() => {
    onSubmit(content.current);
  }, [onSubmit]);

  return (
    <div>
      <div className="h-16 text-sm">
        <MarkdownEditor autoFocus onChange={(e) => (content.current = e)} />
      </div>
      <div>
        <Button onClick={onCancel}>取消</Button>
        <Button onClick={_onSubmit}>提交</Button>
      </div>
    </div>
  );
});
