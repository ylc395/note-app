import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { runInAction, action } from 'mobx';
import { Modal, Checkbox } from '@douyinfe/semi-ui';
import type { CheckboxEvent } from '@douyinfe/semi-ui/lib/es/checkbox';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';
import { menus } from './Contextmenu';

export default observer(function DeleteConfirm() {
  const {
    tagTree: { selectedTag },
  } = container.resolve(MaterialService);

  const { isDeleting } = menus;
  const [cascade, setCascade] = useState(false);

  const handleDelete = useCallback(async () => {
    const {
      tagTree: { deleteTag, selectedTagId },
    } = container.resolve(MaterialService);

    if (!selectedTagId) {
      throw new Error('no selectedTagId');
    }

    await deleteTag(selectedTagId, cascade);

    runInAction(() => {
      menus.isDeleting.set(false);
    });
  }, [cascade]);
  const handleCheck = useCallback((e: CheckboxEvent) => setCascade(e.target.checked || false), []);

  return (
    <Modal
      closable={false}
      visible={isDeleting.get()}
      onCancel={useCallback(
        action(() => isDeleting.set(false)),
        [isDeleting],
      )}
      onOk={handleDelete}
    >
      <p>是否删除标签 {selectedTag?.name}？</p>
      <Checkbox onChange={handleCheck}>删除所有后代标签</Checkbox>
    </Modal>
  );
});
