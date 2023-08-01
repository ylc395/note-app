import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import MainApp, { Statuses } from 'infra/MainApp';

const errorMessages = {
  [Statuses.EmptyToken]: '请填入 token 以连接至 App',
  [Statuses.InvalidToken]: '无效的 token',
} as const;

export default observer(function Network() {
  const mainApp = container.resolve(MainApp);
  const [token, setToken] = useState('');

  return (
    <div className="pb-2 text-gray-600">
      {mainApp.status === Statuses.NotReady && <div>正在连接中...</div>}
      {mainApp.status === Statuses.Online && <div>已连接 App</div>}
      {mainApp.status === Statuses.ConnectionFailure && (
        <div className="flex items-center py-3">
          <ExclamationCircleOutlined className="mr-1" />
          无法连接至 App, 请检查 App 是否正在运行
        </div>
      )}
      {(mainApp.status === Statuses.EmptyToken || mainApp.status === Statuses.InvalidToken) && (
        <div>
          <span className="mb-2 flex items-center text-red-400">
            <ExclamationCircleOutlined className="mr-1" />
            {errorMessages[mainApp.status]}
          </span>
          <input
            className="mr-2 h-6 p-1 focus:outline-none"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="填入 token"
          />
          <button
            className="h-6 cursor-pointer rounded-sm bg-gray-800 px-1 text-gray-100"
            disabled={!token}
            onClick={() => mainApp.setToken(token)}
          >
            确认
          </button>
        </div>
      )}
    </div>
  );
});
