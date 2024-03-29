import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import TaskService from '@domain/service/TaskService';
import { EntityTypes, type MainEntityTypes } from '@domain/model/entity';

export default observer(function Options() {
  const { config, readyState } = container.resolve(TaskService);

  return (
    <div className="mb-4 flex h-6 items-center text-sm text-gray-700">
      <label className="text-gray-400">保存为：</label>
      <select
        disabled={readyState === 'DOING'}
        className="mr-2 rounded-md py-1 pl-1 shadow-sm focus:outline-none"
        value={config.get('targetEntityType')}
        onChange={(e) => config.set('targetEntityType', Number(e.target.value) as MainEntityTypes)}
      >
        <option value={EntityTypes.Material}>材料</option>
        <option value={EntityTypes.Note}>笔记</option>
        <option value={EntityTypes.Memo}>Memo</option>
      </select>
    </div>
  );
});
