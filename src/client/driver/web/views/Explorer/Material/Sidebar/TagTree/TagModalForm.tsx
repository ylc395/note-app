import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { Modal, Form, Input } from '@douyinfe/semi-ui';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { useCallback } from 'react';

export default observer(function TagModalForm() {
  const {
    tagTree: { editingTag, stopCreatingTag, selectedTag },
  } = container.resolve(MaterialService);

  const handleInputChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    action((value: string) => (editingTag!.values.name = value)),
    [editingTag],
  );

  return (
    <Modal title="创建新标签" visible={Boolean(editingTag)} onCancel={stopCreatingTag} onOk={editingTag?.submit}>
      <Form>
        <Form.Label text="父级标签" />
        <Input value={selectedTag?.name || '无'} readonly />
        <Form.Label text="标签名" />
        <Input value={editingTag?.values.name} onChange={handleInputChange} />
        <Form.ErrorMessage error={editingTag?.errors.name} />
      </Form>
    </Modal>
  );
});
