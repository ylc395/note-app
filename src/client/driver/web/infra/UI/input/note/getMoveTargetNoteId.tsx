import { Modal } from 'antd';

import type { NoteDomain } from 'infra/UI';
import TargetTree from 'web/views/Explorer/Note/input/TargetTree';
import { COMMON_MODAL_OPTIONS } from '../../../userInput/utils';

const getMoveTargetNoteId: NoteDomain['getMoveTargetNoteId'] = async (selectedNodes) => {
  if (selectedNodes.length === 0) {
    throw new Error('no selectedNodes');
  }

  const title = selectedNodes.length > 1 ? ` ${selectedNodes.length} 项笔记` : `《${selectedNodes[0]?.title}》`;

  return new Promise((resolve) => {
    const modal = Modal.confirm({
      ...COMMON_MODAL_OPTIONS,
      title: `移动${title}至...`,
      width: 600,
      content: (
        <TargetTree
          onSubmit={(id) => {
            resolve(id);
            modal.destroy();
          }}
          onCancel={() => {
            resolve(undefined);
            modal.destroy();
          }}
          selectedNodes={selectedNodes}
        />
      ),
    });
  });
};

export default getMoveTargetNoteId;
