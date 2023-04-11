import { Modal } from 'antd';
import type { MaterialDomain } from 'infra/UI';

import { COMMON_MODAL_OPTIONS } from '../../utils';

const getNewMaterial: MaterialDomain['getNewMaterial'] = async () => {
  return new Promise((resolve) => {
    const modal = Modal.confirm({
      ...COMMON_MODAL_OPTIONS,
      title: '创建新素材',
      width: 600,
      content: '111',
    });
  });
};

export default getNewMaterial;
