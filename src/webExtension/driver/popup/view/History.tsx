import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';

import HistoryService from 'domain/service/HistoryService';

export default observer(function History() {
  const { historyRecords, clear } = container.resolve(HistoryService);

  return (
    <div>
      <ul className="list-none">
        {historyRecords.map((task) => (
          <li key={task.time}>{task.title}</li>
        ))}
      </ul>
      <button onClick={clear}>清空</button>
    </div>
  );
});
