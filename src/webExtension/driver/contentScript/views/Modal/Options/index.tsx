import { observer } from 'mobx-react-lite';

import TargetPath from './TargetPath';
export default observer(function Options() {
  return (
    <div className="flex items-center text-sm">
      <label>选择保存位置</label>
      <TargetPath />
    </div>
  );
});
