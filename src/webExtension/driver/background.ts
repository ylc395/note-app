import 'reflect-metadata';
import SessionTaskManager from 'service/SessionTaskManger';
import { exposeApi } from 'infra/remoteApi';

exposeApi(new SessionTaskManager());
