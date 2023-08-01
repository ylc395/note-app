import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import MainApp, { Statuses } from 'infra/MainApp';

const errorMessages = {
  [Statuses.EmptyToken]: '空 token',
  [Statuses.InvalidToken]: '无效的 token',
} as const;

export default observer(function Network() {
  const mainApp = container.resolve(MainApp);
  const [token, setToken] = useState('');

  return (
    <div>
      {mainApp.status === Statuses.Online && <div className="text-green-600">通信正常</div>}
      {mainApp.status === Statuses.NotReady && <div>正在连接中</div>}
      {mainApp.status === Statuses.ConnectionFailure && (
        <div>
          无法连接至 App<button onClick={() => mainApp.checkOnline()}>重试</button>
        </div>
      )}
      {typeof mainApp.status === 'string' && <div>{mainApp.status}</div>}
      {(mainApp.status === Statuses.EmptyToken || mainApp.status === Statuses.InvalidToken) && (
        <div>
          <span>{errorMessages[mainApp.status]}</span>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="填入 token" />
          <button disabled={!token} onClick={() => mainApp.setToken(token)}>
            确认
          </button>
        </div>
      )}
    </div>
  );
});
