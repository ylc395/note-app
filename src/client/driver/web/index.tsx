import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from '@domain/common/infra/remote';
import { token as uiToken } from '@domain/app/infra/ui';
import { token as localStorageToken } from '@domain/app/infra/localStorage';
import '@domain/common/infra/mobx';

import httpClient from './infra/httpClient';
import ipcClient from './infra/ipcClient';
import ui from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);
container.registerInstance(uiToken, ui);
container.registerInstance(localStorageToken, webLocalStorage);

const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
