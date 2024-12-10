import { createRoot } from 'react-dom/client';
import '#domain/client/shared/infra/mobx';

import { token as uiToken } from '#domain/client/shared/infra/ui';
import { token as loggerToken } from '#domain/shared/infra/logger';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as localStorageToken } from '#domain/client/app/infra/localStorage';
import { container } from '#domain/shared/infra/singletons';
import { WEB_ROOT_ID } from '#domain/shared/infra/constants';

import ui from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';
import electronRpc from '../electron/rpcClient';

container.register(uiToken, { useValue: ui });
container.register(loggerToken, { useValue: console });
container.register(localStorageToken, { useValue: webLocalStorage });

// 当判断不成立时，esbuild 会把相关语句删去。见 https://esbuild.github.io/api/#drop-labels
if (import.meta.env.VITE_WEB_ENV === 'electron') {
  container.register(rpcToken, { useValue: electronRpc });
}

const appEl = document.getElementById(WEB_ROOT_ID)!;
const root = createRoot(appEl);
root.render(<App />);
