import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';

import { Statuses } from '@domain/model/mainApp';
import MainAppService from '@domain/service/MainAppService';

const errorMessages = {
  [Statuses.EmptyToken]: '请填入 token 以连接至 App',
  [Statuses.InvalidToken]: '无效的 token',
} as const;

export default observer(function Network() {
  const { status, setToken: setMainAppToken, updateAppStatus } = container.resolve(MainAppService);
  const [token, setToken] = useState('');

  useEffect(() => {
    updateAppStatus();
  }, [updateAppStatus]);

  return (
    <div className="pb-2 text-gray-600">
      {status === Statuses.NotReady && <div>正在连接中...</div>}
      {status === Statuses.Online && (
        <div className="flex items-center before:mr-1 before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-green-400">
          已连接 App
        </div>
      )}
      {status === Statuses.ConnectionFailure && (
        <div className="flex items-center before:mr-1 before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-red-400">
          无法连接至 App, 请检查 App 是否正在运行
        </div>
      )}
      {(status === Statuses.EmptyToken || status === Statuses.InvalidToken) && (
        <div>
          <div className="flex items-center before:mr-1 before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-yellow-400">
            {errorMessages[status]}
          </div>
          <input
            className="mr-2 h-6 p-1 focus:outline-none"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="填入 token"
          />
          <button
            className="h-6 cursor-pointer rounded-sm bg-gray-800 px-1 text-gray-100"
            disabled={!token}
            onClick={() => setMainAppToken(token)}
          >
            确认
          </button>
        </div>
      )}
    </div>
  );
});
