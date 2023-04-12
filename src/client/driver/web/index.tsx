import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/Remote';
import { UIInputToken, UIOutputToken } from 'infra/UI';

import { httpClient, ipcClient } from './infra/httpClient';
import { uiInput, uiOutput } from './infra/ui';
import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);
container.registerInstance(UIOutputToken, uiOutput);
container.registerInstance(UIInputToken, uiInput);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
