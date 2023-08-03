import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import { token as mainAppToken, REMOTE_ID as MAIN_APP_REMOTE_ID } from 'infra/MainApp';
import { getRemoteApi } from 'infra/remoteApi';
import { token as pageFactoryToken, REMOTE_ID as PAGE_REMOTE_ID } from 'infra/page';
import 'utils/mobx';

import App from './views/App';

container.registerInstance(mainAppToken, getRemoteApi(MAIN_APP_REMOTE_ID));
container.registerInstance(pageFactoryToken, (tabId) => getRemoteApi(PAGE_REMOTE_ID, tabId));

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
