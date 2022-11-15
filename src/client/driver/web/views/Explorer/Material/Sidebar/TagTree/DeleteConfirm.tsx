import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { runInAction, action, observable } from 'mobx';
import { Modal, Checkbox } from '@douyinfe/semi-ui';
import type { CheckboxEvent } from '@douyinfe/semi-ui/lib/es/checkbox';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export const isDeleting = observable.box(false);

export default observer(function DeleteConfirm() {
  const {
    tagTree: { selectedTag },
  } = container.resolve(MaterialService);

  const [cascade, setCascade] = useState(false);

  const handleDelete = useCallback(async () => {
    const {
      tagTree: { deleteTag },
    } = container.resolve(MaterialService);

    await deleteTag(cascade);

    runInAction(() => {
      isDeleting.set(false);
    });
  }, [cascade]);
  const handleCheck = useCallback((e: CheckboxEvent) => setCascade(e.target.checked || false), []);
  const handleOk = useCallback(
    action(() => isDeleting.set(false)),
    [isDeleting],
  );

  return (
    <Modal closable={false} visible={isDeleting.get()} onCancel={handleOk} onOk={handleDelete}>
      <p>是否删除标签 {selectedTag?.name}？</p>
      <Checkbox onChange={handleCheck}>删除所有后代标签</Checkbox>
    </Modal>
  );
});
