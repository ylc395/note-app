import { render } from 'solid-js/web';
import 'solid-devtools';
import '#domain/client/shared/infra/mobx';
import '#domain/client/shared/infra/queryClient';
import '#domain/client/shared/infra/solid-mobx';

import { token as loggerToken } from '#domain/shared/infra/logger';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as localStorageToken } from '#domain/client/shared/infra/localStorage';
import { container } from '#domain/shared/infra/singletons';

import webLocalStorage from './infra/localStorage';
import electronRpc from '../electron/rpcClient';
import App from './view/App';

container.register(loggerToken, { useValue: console });
container.register(localStorageToken, { useValue: webLocalStorage });

// 当判断不成立时，esbuild 会把相关语句删去。见 https://esbuild.github.io/api/#drop-labels
if (import.meta.env.VITE_WEB_PLATFORM === 'electron') {
  container.register(rpcToken, { useValue: electronRpc });
}

const appEl = document.getElementById(import.meta.env.VITE_WEB_ROOT_ID)!;
render(App, appEl);
