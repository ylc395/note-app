import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import { EntityTypes } from 'interface/entity';
import ClipService from 'service/ClipService';

export default observer(function Options() {
  const { activeTask } = container.resolve(ClipService);

  return (
    <div>
      <select
        disabled
        className="mr-2 rounded-md py-1 pl-1 shadow-sm focus:outline-none"
        value={activeTask?.targetType}
      >
        <option value={EntityTypes.Material}>材料</option>
        <option value={EntityTypes.Note}>笔记</option>
        <option value={EntityTypes.Memo}>Memo</option>
      </select>
    </div>
  );
});
