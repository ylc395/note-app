import { container } from 'tsyringe';
import { PlusOutlined } from '@ant-design/icons';

import MaterialService from '@domain/app/service/MaterialService';
import type { MaterialVO } from '@shared/domain/model/material';
import ButtonMenu from '@web/components/ButtonMenu';

export default function AddButton({ materialId }: { materialId?: MaterialVO['id'] }) {
  const { createDirectory } = container.resolve(MaterialService);
  const handleButtonClick = (action: string, targetId?: MaterialVO['id']) => {
    switch (action) {
      case 'newDirectory':
        return createDirectory(targetId);
      case 'newFile':
        return;
      default:
        break;
    }
  };

  return (
    <ButtonMenu
      items={[
        { label: '新目录', key: 'newDirectory' },
        { label: '新文件', key: 'newFile' },
      ]}
      onClick={(action) => handleButtonClick(action, materialId)}
    >
      <PlusOutlined />
    </ButtonMenu>
  );
}
