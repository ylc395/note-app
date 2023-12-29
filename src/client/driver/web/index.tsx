import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import assert from 'assert';

import { token as remoteToken } from '@domain/common/infra/remote';
import { token as uiToken } from '@domain/app/infra/ui';
import { token as localStorageToken } from '@domain/app/infra/localStorage';
import '@domain/common/infra/mobx';

import httpClient from './infra/httpClient';
import ui from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';
import { APP_CLASS_NAME } from './infra/ui/constants';

container.registerInstance(remoteToken, window.electronIpcHttpClient || httpClient);
container.registerInstance(uiToken, ui);
container.registerInstance(localStorageToken, webLocalStorage);

const appEl = document.querySelector('#app');
assert(appEl);

appEl.className = APP_CLASS_NAME;

const root = createRoot(appEl);
root.render(<App />);
