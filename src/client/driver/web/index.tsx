import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/Remote';
import { token as contextMenuToken } from 'infra/Contextmenu';

import { httpClient, ipcClient } from './infra/httpClient';
import { webContextmenu, ipcContextmenu } from './infra/contextmenu';
import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);
container.registerInstance(contextMenuToken, ipcContextmenu || webContextmenu);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
