import { observer } from 'mobx-react-lite';
import { Modal } from '@douyinfe/semi-ui';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import Form from './Form';

export default observer(function MaterialModalForm() {
  const { editingMaterials, clearFiles } = container.resolve(MaterialService);

  return (
    <Modal title="创建新资料" visible={Boolean(editingMaterials)} onCancel={clearFiles} onOk={editingMaterials?.submit}>
      {editingMaterials?.values.map(({ fileId }, i) => (
        <Form key={fileId} index={i} />
      ))}
    </Modal>
  );
});