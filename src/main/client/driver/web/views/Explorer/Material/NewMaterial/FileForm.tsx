import { observer } from 'mobx-react-lite';
import { Form, Input, Button } from 'antd';
import { useCallback } from 'react';

import type FileFormModel from 'model/material/FileForm';
import selectFiles from 'web/infra/selectFiles';

export default observer(function FileForm({ model }: { model: FileFormModel }) {
  const handleSelectFile = useCallback(async () => {
    const file = (await selectFiles())?.[0];

    if (!file) {
      return;
    }

    model.updateValue('file', {
      mimeType: file.type,
      ...(__PLATFORM__ === 'electron' ? { path: file.path } : { data: await file.arrayBuffer() }),
    });
    model.updateValue('name', file.name);
  }, [model]);

  return (
    <Form>
      <Form.Item label="素材名">
        <Input value={model.values.name} onChange={(e) => model.updateValue('name', e.target.value)} />
      </Form.Item>
      <Form.Item label="选择文件">
        <Button onClick={handleSelectFile}>点击选择</Button>
      </Form.Item>
    </Form>
  );
});
