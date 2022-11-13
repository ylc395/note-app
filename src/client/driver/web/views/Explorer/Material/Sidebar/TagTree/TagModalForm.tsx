import { observer } from 'mobx-react-lite';
import { action, flowResult } from 'mobx';
import { Modal, Form, Input } from '@douyinfe/semi-ui';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export default observer(function TagModalForm() {
  const {
    tagTree: { editingTag, stopCreatingTag, selectedTag },
  } = container.resolve(MaterialService);

  return (
    <Modal
      title="创建新标签"
      visible={Boolean(editingTag)}
      onCancel={stopCreatingTag}
      onOk={() => flowResult(editingTag?.submit())}
    >
      <Form>
        <Form.Label text="父级标签" />
        <Input value={selectedTag?.name || '无'} readonly />
        <Form.Label text="标签名" />
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
        <Input value={editingTag?.values.name} onChange={action((value) => (editingTag!.values.name = value))} />
        <Form.ErrorMessage error={editingTag?.errors.name} />
      </Form>
    </Modal>
  );
});
