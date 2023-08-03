import 'reflect-metadata';
import { container } from 'tsyringe';

import { exposeApi } from 'infra/remoteApi';
import SessionTaskManager from 'service/SessionTaskManger';
import { token as mainAppToken } from 'infra/MainApp';

import MainApp from './MainApp';
import { getPage } from './page';

const mainApp = new MainApp();

container.registerInstance(mainAppToken, mainApp);

exposeApi(new SessionTaskManager());
exposeApi(mainApp);
exposeApi(getPage());
