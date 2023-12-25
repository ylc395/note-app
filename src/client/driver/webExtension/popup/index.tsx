import 'reflect-metadata';
import '@utils/mobx';

import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import { wrap } from 'comlink';
import { chromeRuntimeMessageEndpoint } from 'comlink-adapters';

import BackgroundService from '@domain/service/BackgroundService';

import App from './views/App';

container.registerInstance(BackgroundService, wrap(chromeRuntimeMessageEndpoint()) as unknown as BackgroundService);

const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
