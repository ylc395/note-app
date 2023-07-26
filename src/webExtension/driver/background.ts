import 'reflect-metadata';
import { exposeApi } from 'infra/remoteApi';
import SessionTaskManager from 'service/SessionTaskManger';
import WebPageService from 'service/WebPageService';

exposeApi(new SessionTaskManager());
exposeApi(WebPageService);
