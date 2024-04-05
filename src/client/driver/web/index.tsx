import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import assert from 'assert';

import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as uiToken } from '@shared/domain/infra/ui';
import { token as localStorageToken } from '@domain/app/infra/localStorage';
import '@domain/common/infra/mobx';

import ui from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';
import { APP_CLASS_NAME } from './infra/ui/constants';
import electronRpc from '../electron/rpc';

container.registerInstance(uiToken, ui);
container.registerInstance(rpcToken, window.IS_ELECTRON ? electronRpc : null);
container.registerInstance(localStorageToken, webLocalStorage);

const appEl = document.querySelector('#app');
assert(appEl);

appEl.className = APP_CLASS_NAME;

const root = createRoot(appEl);
root.render(<App />);
