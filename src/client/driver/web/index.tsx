import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/remote';
import { token as uiToken } from 'infra/ui';
import { token as localStorageToken } from 'infra/localStorage';
import 'utils/mobx';

import httpClient from './infra/httpClient';
import ipcClient from './infra/fakeHttpClient';
import { getRootElement, ui } from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);
container.registerInstance(uiToken, ui);
container.registerInstance(localStorageToken, webLocalStorage);

const root = createRoot(getRootElement());
root.render(<App />);
