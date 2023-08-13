import { observer } from 'mobx-react-lite';
import { Form, Input, Button } from 'antd';

import type FormModel from 'model/material/Form';
import selectFiles from 'web/infra/selectFiles';
import { IS_ELECTRON } from 'infra/constants';

export default observer(function FileForm({ model }: { model: FormModel }) {
  const handleSelectFile = async () => {
    const file = (await selectFiles())?.[0];

    if (!file) {
      return;
    }

    model.files = [
      {
        mimeType: file.type,
        ...(IS_ELECTRON ? { path: file.path } : { data: await file.arrayBuffer(), name: file.name }),
      },
    ];
  };

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
