import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import TaskService from 'service/TaskService';
import { EntityTypes } from 'interface/entity';

export default observer(function Options() {
  const { config, isUnavailable } = container.resolve(TaskService);

  return isUnavailable || !config.config ? null : (
    <div>
      <select
        value={config.config.targetEntityType}
        onChange={(e) => config.set('targetEntityType', Number(e.target.value) as EntityTypes)}
      >
        <option value={EntityTypes.Material}>材料</option>
        <option value={EntityTypes.Note}>笔记</option>
        <option value={EntityTypes.Memo}>Memo</option>
      </select>
    </div>
  );
});
