import { container } from 'tsyringe';
import { AiOutlinePlus, AiOutlineShrink, AiOutlineSetting } from 'react-icons/ai';
import { observer } from 'mobx-react-lite';

import Button from '@web/components/Button';
import MaterialService from '@domain/app/service/MaterialService';

export default observer(function Operations() {
  const { createMaterial, tree } = container.resolve(MaterialService);

  return (
    <div className="flex grow justify-between">
      <Button onClick={() => createMaterial()}>
        <AiOutlinePlus />
      </Button>
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
