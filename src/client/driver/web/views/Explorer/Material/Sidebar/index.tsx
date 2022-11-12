import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';

import AddMenu from './AddMenu';

export default observer(function MaterialSidebar() {
  return (
    <Resizable enable={{ right: true }} className="border-r bg-gray-100">
      <div className="flex items-center justify-between">
        <div>资料库</div>
        <AddMenu />
      </div>
    </Resizable>
  );
});
