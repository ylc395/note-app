import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { exposeApi, getRemoteApi } from 'infra/remoteApi';
import { token as mainAppToken, REMOTE_ID as MAIN_APP_REMOTE_ID } from 'infra/MainApp';
import { token as pageFactoryToken, type Page } from 'infra/page';
import MainAppService from 'service/MainAppService';
import 'utils/mobx';

import App from './views/App';
import { getPage } from './page';

container.registerInstance(mainAppToken, getRemoteApi(MAIN_APP_REMOTE_ID));
container.registerInstance(pageFactoryToken, getPage);
container.registerInstance(MainAppService, new MainAppService());

function createAppRoot() {
  const container = document.createElement('div');
  // reset inheritance. see https://web.dev/shadowdom-v1/#resetting-inheritable-styles
  container.style.setProperty('all', 'initial', 'important');
  document.body.append(container);

  return container.attachShadow({ mode: 'open' });
}

const page = getPage() as Required<Page>;

page.ready().then(() => {
  const root = createRoot(createAppRoot());
  root.render(<App />);
});

exposeApi(page);
