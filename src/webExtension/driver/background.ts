import 'reflect-metadata';
import { exposeApi } from 'infra/remoteApi';
import SessionTaskManager from 'service/SessionTaskManger';
import WebPageService from 'service/WebPageService';
import MainApp from 'infra/MainApp';

exposeApi(new SessionTaskManager());
exposeApi(new MainApp());
exposeApi(WebPageService);
