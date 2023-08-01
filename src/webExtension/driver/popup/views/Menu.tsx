import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

import TaskService from 'service/TaskService';
import { TaskTypes } from 'model/task';
import { EntityTypes } from 'interface/entity';

const ACTIONS = [
  TaskTypes.SelectElement,
  TaskTypes.SelectElementText,
  TaskTypes.SelectPage,
  TaskTypes.ScreenShot,
  TaskTypes.ExtractText,
] as const;

const ACTION_TEXT_MAP = {
  [TaskTypes.SelectElement]: { text: '手动选取页面元素（HTML）', visible: EntityTypes.Material },
  [TaskTypes.SelectElementText]: { text: '手动选取页面元素（Markdown）', visible: 'all' },
  [TaskTypes.SelectPage]: { text: '选取整个页面（HTML）', visible: EntityTypes.Material },
  [TaskTypes.ScreenShot]: { text: '截屏（图片）', visible: EntityTypes.Material },
  [TaskTypes.ExtractText]: { text: '提取正文（Markdown）', visible: 'all' },
} as const;

export default observer(function Menu() {
  const taskService = container.resolve(TaskService);
  const { config } = taskService;

  return (
    <div>
      <ul className="list-none">
        {ACTIONS.map((action) => {
          const { visible, text } = ACTION_TEXT_MAP[action];

          return visible === 'all' || visible === config.get('targetEntityType') ? (
            <li key={action}>
              <button
                className={clsx(
                  action === taskService.currentAction && 'bg-red-300',
                  'mb-3 block h-9 w-full rounded-md bg-gray-800 text-sm text-gray-100',
                )}
                disabled={taskService.isUnavailable}
                onClick={() => taskService.addTask(action)}
              >
                {text}
              </button>
            </li>
          ) : null;
        })}
      </ul>
    </div>
  );
});
