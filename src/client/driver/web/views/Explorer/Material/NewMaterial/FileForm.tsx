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
      name: file.name,
      mimeType: file.type,
      ...(__PLATFORM__ === 'electron' ? { path: file.path } : { data: await file.arrayBuffer() }),
    });
  }, [model]);

  return (
    <Form>
      <Form.Item label="文件名">
        <Input onChange={(e) => model.updateValue('name', e.target.value)} />
      </Form.Item>
      <Form.Item label="选择文件">
        <Button onClick={handleSelectFile}>点击选择</Button>
        {model.values.file?.name}
      </Form.Item>
    </Form>
  );
});
