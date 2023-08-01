import { observer } from 'mobx-react-lite';
import { EntityTypes } from 'interface/entity';
import { container } from 'tsyringe';

import TaskService from 'service/TaskService';

export default observer(function TargetPath() {
  const { config } = container.resolve(TaskService);

  return (
    <select
      className="mr-2 rounded-md py-1 pl-1"
      value={config.get('targetEntityType')}
      onChange={(e) => config.set('targetEntityType', Number(e.target.value) as EntityTypes)}
    >
      <option value={EntityTypes.Material}>材料</option>
      <option value={EntityTypes.Note}>笔记</option>
      <option value={EntityTypes.Memo}>Memo</option>
    </select>
  );
});
