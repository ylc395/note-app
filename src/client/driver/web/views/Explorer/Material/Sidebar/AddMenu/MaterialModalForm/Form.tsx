import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { Form, Input, type InputProps } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { useCallback } from 'react';

export default observer(function MaterialForm({ index }: { index: number }) {
  const { editingMaterials } = container.resolve(MaterialService);
  const model = editingMaterials?.values[index];

  const handleCommentChange = useCallback<NonNullable<TextAreaProps['onChange']>>(
    action((e) => model && (model.comment = e.target.value)),
    [model],
  );
  const handleNameChange = useCallback<NonNullable<InputProps['onChange']>>(
    action((e) => model && (model.name = e.target.value)),
    [model],
  );

  return (
    <Form>
      <Form.Item
        label="资料名"
        requiredMark
        help={editingMaterials?.errors[index]?.name}
        validateStatus={editingMaterials?.errors[index]?.name && 'error'}
      >
        <Input value={model?.name} onChange={handleNameChange} />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea value={model?.comment} onChange={handleCommentChange} />
      </Form.Item>
    </Form>
  );
});
