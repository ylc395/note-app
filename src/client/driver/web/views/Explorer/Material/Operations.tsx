import { container } from 'tsyringe';
import { AiOutlineFileAdd, AiOutlineFolderAdd, AiOutlineShrink, AiOutlineSetting } from 'react-icons/ai';
import { observer } from 'mobx-react-lite';

import Button from '@web/components/Button';
import MaterialService from '@domain/app/service/MaterialService';
import MaterialExplorer from '@domain/app/model/material/Explorer';

export default observer(function Operations() {
  const { createDirectory, createMaterialFromFile } = container.resolve(MaterialService);
  const { tree } = container.resolve(MaterialExplorer);

  return (
    <div className="flex grow justify-between">
      <div className="flex">
        <Button onClick={() => createDirectory(null)}>
          <AiOutlineFolderAdd />
        </Button>
        <Button onClick={() => createMaterialFromFile(null)}>
          <AiOutlineFileAdd />
        </Button>
      </div>
      <div className="flex">
        <Button disabled={tree.expandedNodes.length === 0} onClick={tree.collapseAll}>
          <AiOutlineShrink />
        </Button>
        <Button>
          <AiOutlineSetting />
        </Button>
      </div>
    </div>
  );
});
