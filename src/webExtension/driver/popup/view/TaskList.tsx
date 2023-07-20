import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import TaskService from 'service/TaskService';

export default observer(function TaskList() {
  const { tasks } = container.resolve(TaskService);

  return (
    <div>
      <ul className="list-none">
        {tasks.map((task) => (
          <li key={task.id}>{task.title} 保存中...</li>
        ))}
      </ul>
    </div>
  );
});
