import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import TaskService from 'domain/service/TaskService';
import { TaskTypes } from 'domain/model/task';
import { EntityTypes } from 'shared/interface/entity';

const ACTIONS = [
  TaskTypes.SelectElement,
  TaskTypes.SelectElementText,
  TaskTypes.SelectPage,
  TaskTypes.ScreenShot,
  TaskTypes.ExtractText,
  TaskTypes.ExtractSelection,
] as const;

const ACTION_TEXT_MAP = {
  [TaskTypes.SelectElement]: { text: '手动选取页面元素（HTML）', visible: EntityTypes.Material },
  [TaskTypes.SelectElementText]: { text: '手动选取页面元素（Markdown）', visible: 'all' },
  [TaskTypes.SelectPage]: { text: '选取整个页面（HTML）', visible: EntityTypes.Material },
  [TaskTypes.ScreenShot]: { text: '截屏（图片）', visible: EntityTypes.Material },
  [TaskTypes.ExtractText]: { text: '提取正文（Markdown）', visible: 'all' },
  [TaskTypes.ExtractSelection]: { text: '提取选中部分（Markdown）', visible: 'all' },
} as const;

export default observer(function Menu() {
  const taskService = container.resolve(TaskService);
  const { config, hasSelection } = taskService;

  return (
    <div>
      <ul className="list-none">
        {ACTIONS.map((action) => {
          const { visible, text } = ACTION_TEXT_MAP[action];

          return visible === 'all' || visible === config.config?.targetEntityType ? (
            <li key={action}>
              <button
                className={action === taskService.currentAction ? 'bg-red-300' : ''}
                disabled={taskService.isUnavailable || (action === TaskTypes.ExtractSelection && !hasSelection)}
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
