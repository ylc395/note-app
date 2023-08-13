import { observer } from 'mobx-react-lite';
import { Form, Input } from 'antd';

import type FormModel from 'model/material/Form';
import MarkdownEditor from 'web/components/MarkdownEditor';

export default observer(function TextForm({ model }: { model: FormModel }) {
  return (
    <Form>
      <Form.Item label="文件名">
        <Input onChange={(e) => model.updateValue('name', e.target.value)} />
      </Form.Item>
      <Form.Item label="原始来源 URL">
        <Input onChange={(e) => model.updateValue('sourceUrl', e.target.value)} />
      </Form.Item>
      <Form.Item label="内容">
        <MarkdownEditor onChange={(content) => (model.files = [{ mimeType: 'text/markdown', data: content }])} />
      </Form.Item>
    </Form>
  );
});
