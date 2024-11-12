import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import assert from 'assert';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as uiToken } from '#domain/shared/infra/ui/common';
import { token as localStorageToken } from '#domain/client/app/infra/localStorage';
import { APP_NAME } from '#domain/shared/infra/constants';
import '#domain/client/common/infra/mobx';

import ui from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';
import electronRpc from '../electron/rpc';

container.registerInstance(uiToken, ui);
container.registerInstance(rpcToken, window.IS_ELECTRON ? electronRpc : null);
container.registerInstance(localStorageToken, webLocalStorage);

const appEl = document.querySelector('#app') as HTMLElement | null;
assert(appEl);

appEl.className = APP_NAME;
appEl.style.userSelect = 'none';

const root = createRoot(appEl);
root.render(<App />);
