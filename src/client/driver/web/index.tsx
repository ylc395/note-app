import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/remote';
import { token as UIToken } from 'infra/ui';

import { httpClient, ipcClient } from './infra/httpClient';
import { getRootElement, ui } from './infra/ui';
import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);
container.registerInstance(UIToken, ui);

const root = createRoot(getRootElement());
root.render(<App />);
