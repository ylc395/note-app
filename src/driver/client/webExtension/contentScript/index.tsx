import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import { wrap, expose } from 'comlink';
import { chromeRuntimeMessageEndpoint } from 'comlink-adapters';
import '@utils/mobx';

import BackgroundService from '@domain/service/BackgroundService';
import PageService from '@domain/service/PageService';

import App from './views/App';

container.registerInstance(BackgroundService, wrap(chromeRuntimeMessageEndpoint()) as unknown as BackgroundService);

const pageService = container.resolve(PageService);
function createAppRoot() {
  const container = document.createElement('div');
  // reset inheritance. see https://web.dev/shadowdom-v1/#resetting-inheritable-styles
  container.style.setProperty('all', 'initial', 'important');
  document.body.append(container);

  return container.attachShadow({ mode: 'open' });
}

pageService.ready().then(() => {
  const root = createRoot(createAppRoot());
  root.render(<App />);
});

expose(pageService, chromeRuntimeMessageEndpoint());
