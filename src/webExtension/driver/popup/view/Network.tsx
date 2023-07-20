import { container } from 'tsyringe';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import Client, { Statuses } from 'infra/HttpClient';

const errorMessages = {
  [Statuses.EmptyToken]: '空 token',
  [Statuses.InvalidToken]: '无效的 token',
} as const;

export default observer(function Network() {
  const client = container.resolve(Client);
  const [token, setToken] = useState('');

  return (
    <div>
      {client.status === Statuses.Online && <div>通信正常</div>}
      {client.status === Statuses.NotReady && <div>正在连接中</div>}
      {client.status === Statuses.ConnectionFailure && (
        <div>
          无法连接至 App<button onClick={() => client.checkOnline()}>重试</button>
        </div>
      )}
      {typeof client.status === 'string' && <div>{client.status}</div>}
      {(client.status === Statuses.EmptyToken || client.status === Statuses.InvalidToken) && (
        <div>
          <span>{errorMessages[client.status]}</span>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="填入 token" />
          <button disabled={!token} onClick={() => client.setToken(token)}>
            确认
          </button>
        </div>
      )}
    </div>
  );
});
