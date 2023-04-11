import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/Remote';
import { commonInputToken, commonOutputToken, materialDomainInputToken } from 'infra/UI';

import { httpClient, ipcClient } from './infra/httpClient';
import commonOutput from './infra/UI/output';
import { commonInput, materialDomainInput } from './infra/UI/input';
import App from './views/App';

container.registerInstance(remoteToken, ipcClient || httpClient);
container.registerInstance(commonOutputToken, commonOutput);
container.registerInstance(commonInputToken, commonInput);
container.registerInstance(materialDomainInputToken, materialDomainInput);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
