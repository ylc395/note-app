import { observer } from 'mobx-react-lite';
import { Form, Input, Button } from 'antd';

import type FormModel from '@domain/app/model/material/Form';
import selectFiles from '@web/infra/selectFiles';
import { IS_ELECTRON } from '@shared/domain/infra/constants';

export default observer(function FileForm({ model }: { model: FormModel }) {
  const handleSelectFile = async () => {
    const file = (await selectFiles())?.[0];

    if (!file) {
      return;
    }

    model.file = {
      mimeType: file.type,
      ...(IS_ELECTRON ? { path: file.path } : { data: await file.arrayBuffer(), name: file.name }),
    };

    model.updateValue('name', file.name);
  };

  return (
    <Form>
      <Form.Item label="素材名">
        <Input value={model.values.title} onChange={(e) => model.updateValue('name', e.target.value)} />
      </Form.Item>
      <Form.Item label="选择文件">
        <Button onClick={handleSelectFile}>点击选择</Button>
      </Form.Item>
    </Form>
  );
});
