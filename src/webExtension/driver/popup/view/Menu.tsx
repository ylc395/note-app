import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import TaskService from 'domain/service/TaskService';
import { TaskTypes } from 'domain/model/Task';

const ACTIONS = [
  TaskTypes.SelectElement,
  TaskTypes.SelectPage,
  TaskTypes.ExtractText,
  TaskTypes.ExtractSelection,
  TaskTypes.ScreenShot,
] as const;

const ACTION_TEXT_MAP = {
  [TaskTypes.SelectElement]: '手动选取页面元素',
  [TaskTypes.SelectPage]: '选取整个页面',
  [TaskTypes.ExtractText]: '提取正文',
  [TaskTypes.ExtractSelection]: '提取选中部分',
  [TaskTypes.ScreenShot]: '截屏',
} as const;

export default observer(function Menu() {
  const taskService = container.resolve(TaskService);

  return (
    <div>
      <ul className="list-none">
        {ACTIONS.map((action) => (
          <li key={action}>
            <button
              className={action === taskService.currentAction ? 'bg-red-300' : ''}
              disabled={Boolean(taskService.currentAction)}
              onClick={() => taskService.dispatch(action)}
            >
              {ACTION_TEXT_MAP[action]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
