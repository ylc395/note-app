import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import TaskService from 'service/TaskService';
import TargetPath from './TargetPath';
import TargetType from './TargetType';

export default observer(function Options() {
  const { config, isUnavailable } = container.resolve(TaskService);

  return isUnavailable || !config ? null : (
    <div className="mb-4">
      <div className="mb-2 text-gray-400">保存至</div>
      <div className="flex h-6 items-center text-sm text-gray-700">
        <TargetType />
        <TargetPath />
      </div>
    </div>
  );
});
