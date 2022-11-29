import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { Modal, Form, Input } from 'antd';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { ChangeEvent, useCallback } from 'react';

export default observer(function TagModalForm() {
  const {
    tagTree: { editingTag, stopEditingTag, selectedTag, editingMode },
  } = container.resolve(MaterialService);

  const handleInputChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    action((e: ChangeEvent<HTMLInputElement>) => (editingTag!.values.name = e.target.value)),
    [editingTag],
  );

  return (
    <Modal
      title={editingMode === 'create' ? '创建新标签' : '重命名'}
      open={Boolean(editingTag)}
      onCancel={stopEditingTag}
      onOk={editingTag?.submit}
      closable={false}
    >
      <Form>
        {editingMode === 'create' && (
          <Form.Item label="父级标签">
            <Input value={selectedTag?.name || '无'} disabled />
          </Form.Item>
        )}
        <Form.Item label="标签名" help={editingTag?.errors.name}>
          <Input value={editingTag?.values.name} onChange={handleInputChange} />
        </Form.Item>
      </Form>
    </Modal>
  );
});
