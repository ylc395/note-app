import { observer } from 'mobx-react-lite';
import { Form, Input } from 'antd';

import type TextFormModel from 'model/material/TextForm';
import MarkdownEditor from 'web/components/MarkdownEditor';

export default observer(function TextForm({ model }: { model: TextFormModel }) {
  return (
    <Form>
      <Form.Item label="文件名">
        <Input onChange={(e) => model.updateValue('name', e.target.value)} />
      </Form.Item>
      <Form.Item label="原始来源 URL">
        <Input onChange={(e) => model.updateValue('sourceUrl', e.target.value)} />
      </Form.Item>
      <Form.Item label="内容">
        <MarkdownEditor onChange={(content) => model.updateValue('text', content)} />
      </Form.Item>
    </Form>
  );
});
