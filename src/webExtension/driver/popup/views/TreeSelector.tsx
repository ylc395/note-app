import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import Tree from 'components/Tree';
import TaskService from 'service/TaskService';

export default observer(function TreeSelector() {
  const { config, isUnavailable } = container.resolve(TaskService);

  return (
    <div>
      {config.target && <span>{config.target}</span>}
      {config.targetTree && <Tree tree={config.targetTree} />}
    </div>
  );
});
