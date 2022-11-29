import { observer } from 'mobx-react-lite';
import { Resizable } from 're-resizable';
import { Collapse } from 'antd';

import AddMenu from './AddMenu';
import { TagTree, TagTreeHeader, TagModalForm, DeleteConfirm } from './TagTree';
import MaterialView from './MaterialView';

export default observer(function MaterialSidebar() {
  return (
    <Resizable
      enable={{ right: true }}
      minWidth={200}
      defaultSize={{ width: 200, height: 'auto' }}
      className="border-r bg-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>资料库</div>
        <AddMenu />
      </div>
      <Collapse expandIconPosition="start" defaultActiveKey={['tagTree', 'view']}>
        <Collapse.Panel header="视图" key="view">
          <MaterialView />
        </Collapse.Panel>
        <Collapse.Panel header={<TagTreeHeader />} key="tagTree">
          <TagTree />
        </Collapse.Panel>
      </Collapse>
      <TagModalForm />
      <DeleteConfirm />
    </Resizable>
  );
});
