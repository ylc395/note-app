import { observer } from 'mobx-react-lite';
import { Collapse } from 'antd';

export default observer(function NoteCustomView() {
  return (
    <div>
      <Collapse ghost>
        <Collapse.Panel header="今日创建" key="todayCreated"></Collapse.Panel>
        <Collapse.Panel header="最近修改" key="latestUpdated"></Collapse.Panel>
        <Collapse.Panel header="最近新建" key="latestCreated"></Collapse.Panel>
        <Collapse.Panel header="最多点击" key="mostRead"></Collapse.Panel>
        <Collapse.Panel header="最多被引" key="mostReferred"></Collapse.Panel>
      </Collapse>
    </div>
  );
});
