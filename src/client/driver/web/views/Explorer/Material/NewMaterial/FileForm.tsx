import { observer } from 'mobx-react-lite';
import { Form, Input } from 'antd';

import type FileFormModel from 'model/material/FileForm';

export default observer(function FileForm({ model }: { model: FileFormModel }) {
  return (
    <Form>
      <Form.Item label="文件名">
        <Input onChange={(e) => model.updateValue('name', e.target.value)} />
      </Form.Item>
    </Form>
  );
});
