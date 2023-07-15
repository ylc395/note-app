import 'reflect-metadata';
import SessionTaskManager from 'domain/service/SessionTaskManger';
import { exposeApi } from 'domain/infra/remoteApi';

exposeApi(new SessionTaskManager());
