import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import { Collapse } from '@douyinfe/semi-ui';

import AddMenu from './AddMenu';
import TagTree from './TagTree';
import TagModalForm from './TagTree/TagModalForm';

export default observer(function MaterialSidebar() {
  return (
    <Resizable enable={{ right: true }} className="border-r bg-gray-100">
      <div className="flex items-center justify-between">
        <div>资料库</div>
        <AddMenu />
      </div>
      <Collapse expandIconPosition="left">
        <TagTree />
      </Collapse>
      <TagModalForm />
    </Resizable>
  );
});
