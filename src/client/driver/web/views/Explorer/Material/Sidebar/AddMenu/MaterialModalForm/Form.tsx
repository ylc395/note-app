import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { Form, Input, TreeSelect, type InputProps, type TreeSelectProps } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { useCallback } from 'react';

export default observer(function MaterialForm({ index }: { index: number }) {
  const {
    editingMaterials,
    tagTree: { roots },
  } = container.resolve(MaterialService);
  const model = editingMaterials?.values[index];

  const handleCommentChange = useCallback<NonNullable<TextAreaProps['onChange']>>(
    action((e) => model && (model.comment = e.target.value)),
    [model],
  );
  const handleNameChange = useCallback<NonNullable<InputProps['onChange']>>(
    action((e) => model && (model.name = e.target.value)),
    [model],
  );
  const handleTagsChange = useCallback<NonNullable<TreeSelectProps['onChange']>>(
    action((e) => model && (model.tags = e)),
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
      <Form.Item label="标签">
        <TreeSelect
          allowClear
          multiple
          maxTagCount={5}
          showSearch
          value={model?.tags}
          onChange={handleTagsChange}
          treeData={roots as unknown as TreeSelectProps['treeData']}
          fieldNames={{ label: 'name', value: 'id' }}
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea value={model?.comment} onChange={handleCommentChange} />
      </Form.Item>
    </Form>
  );
});
