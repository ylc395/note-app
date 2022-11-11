import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/Remote';
import { httpClient, ipcClient } from './utils/httpClient';

import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
