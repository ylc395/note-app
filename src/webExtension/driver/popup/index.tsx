import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import { token as mainAppToken, REMOTE_ID as MAIN_APP_REMOTE_ID } from 'infra/MainApp';
import { getRemoteApi } from 'infra/remoteApi';
import { token as pageFactoryToken } from 'infra/page';
import SessionTaskManager, { REMOTE_ID as SESSION_MANAGER_REMOTE_ID } from 'service/SessionTaskManger';
import MainAppService from 'service/MainAppService';
import 'utils/mobx';

import App from './views/App';
import { getPage } from './page';

container.registerInstance(mainAppToken, getRemoteApi(MAIN_APP_REMOTE_ID));
container.registerInstance(SessionTaskManager, getRemoteApi(SESSION_MANAGER_REMOTE_ID));
container.registerInstance(MainAppService, new MainAppService(true));
container.registerInstance(pageFactoryToken, getPage);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
