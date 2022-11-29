import { observer } from 'mobx-react-lite';

export default observer(function MaterialView() {
  return (
    <div>
      <div>全部资料</div>
      <div>今日入库</div>
      <div>无标签</div>
    </div>
  );
});
