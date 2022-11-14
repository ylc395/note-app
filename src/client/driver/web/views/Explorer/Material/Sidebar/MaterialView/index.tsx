import { observer } from 'mobx-react-lite';
import { Collapse } from '@douyinfe/semi-ui';

export const panelKey = 'view';

export default observer(function MaterialView() {
  return (
    <Collapse.Panel header="视图" itemKey={panelKey}>
      <div>全部资料</div>
      <div>今日入库</div>
      <div>无标签</div>
    </Collapse.Panel>
  );
});
