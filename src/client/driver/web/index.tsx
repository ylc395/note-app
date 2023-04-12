import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/Remote';

import { httpClient, ipcClient } from './infra/httpClient';
import { getRootElement } from './infra/ui';
import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);

const root = createRoot(getRootElement());
root.render(<App />);
