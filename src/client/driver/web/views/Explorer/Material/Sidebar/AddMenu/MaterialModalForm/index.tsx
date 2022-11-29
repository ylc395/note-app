import { observer } from 'mobx-react-lite';
import { Modal } from 'antd';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import Form from './Form';

export default observer(function MaterialModalForm() {
  const { editingMaterials, clearFiles } = container.resolve(MaterialService);

  return (
    <Modal
      title="创建新资料"
      open={Boolean(editingMaterials)}
      onCancel={clearFiles}
      onOk={editingMaterials?.submit}
      closable={false}
      destroyOnClose
    >
      {editingMaterials?.values.map(({ fileId }, i) => (
        <Form key={fileId} index={i} />
      ))}
    </Modal>
  );
});
