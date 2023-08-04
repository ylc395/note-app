import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { LoadingOutlined } from '@ant-design/icons';
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
  const { config, readyState } = taskService;
  const isDisabled = readyState === 'DOING';

  return (
    <div>
      <ul>
        {ACTIONS.map((action) => {
          const { visible, text } = ACTION_TEXT_MAP[action];

          return visible === 'all' || visible === config.get('targetEntityType') ? (
            <li key={action}>
              <button
                className={clsx(
                  'mb-3 flex h-9 w-full items-center justify-center rounded-md bg-gray-800 text-sm text-gray-100',
                  isDisabled && 'cursor-not-allowed opacity-60',
                )}
                disabled={isDisabled}
                onClick={() => taskService.addTask(action)}
              >
                {action === taskService.currentAction && <LoadingOutlined className="mr-1" />}
                {text}
              </button>
            </li>
          ) : null;
        })}
      </ul>
    </div>
  );
});
