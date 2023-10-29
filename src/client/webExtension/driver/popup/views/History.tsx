import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { HistoryOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { useState } from 'react';

import HistoryService from 'service/HistoryService';

export default observer(function History() {
  const { historyRecords, clear } = container.resolve(HistoryService);
  const [visible, setVisible] = useState(false);

  return historyRecords.length === 0 ? null : (
    <div>
      <button onClick={() => setVisible(!visible)} className="flex cursor-pointer items-center">
        <HistoryOutlined className="mr-1" />
        历史
      </button>
      <div className={clsx('absolute right-0 top-0', !visible && 'hidden')}>
        <ul>
          {historyRecords.map((task) => (
            <li key={task.time}>{task.title}</li>
          ))}
        </ul>
        <button onClick={clear}>清空</button>
      </div>
    </div>
  );
});
