import { createRoot } from 'react-dom/client';
import '#domain/client/shared/infra/mobx';

import { token as uiToken } from '#domain/client/shared/infra/ui';
import { token as loggerToken } from '#domain/shared/infra/logger';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as localStorageToken } from '#domain/client/app/infra/localStorage';
import { APP_NAME } from '#domain/shared/infra/constants';
import { container } from '#domain/shared/infra/singletons';

import ui from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';
import electronRpc from '../electron/rpcClient';

container.register(uiToken, { useValue: ui });
container.register(loggerToken, { useValue: console });
container.register(localStorageToken, { useValue: webLocalStorage });

// 当判断不成立时，esbuild 会把相关语句删去。见 https://esbuild.github.io/api/#drop-labels
if (__WEB_ENV__ === 'electron') {
  container.register(rpcToken, { useValue: electronRpc });
}

const appEl: HTMLElement = document.querySelector('#app')!;
appEl.className = APP_NAME;
appEl.style.userSelect = 'none';

const root = createRoot(appEl);
root.render(<App />);
