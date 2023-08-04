import 'reflect-metadata';
import { container } from 'tsyringe';

import { exposeApi } from 'infra/remoteApi';
import SessionTaskManager from 'service/SessionTaskManger';
import MainAppService from 'service/MainAppService';
import { token as mainAppToken } from 'infra/MainApp';

import MainApp from './MainApp';
import { getPage } from './page';

const mainApp = new MainApp();

container.registerInstance(mainAppToken, mainApp);
container.registerInstance(MainAppService, new MainAppService());

exposeApi(new SessionTaskManager());
exposeApi(mainApp);
exposeApi(getPage());
