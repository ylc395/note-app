import type { Tabs } from 'webextension-polyfill';
import type { TaskTypes } from './Task';

export enum RequestTypes {
  QuerySessionTasks = 'QUERY_SESSION_TASKS',
  AddTask = 'ADD_TASK',
  StartTask = 'START_TASK',
  CancelTask = 'CANCEL_TASK',
  FinishTask = 'FINISH_TASK',
}

export interface QueryTaskRequest {
  type: RequestTypes.QuerySessionTasks;
}

export interface AddTaskRequest {
  type: RequestTypes.AddTask;
  task: { tabId: NonNullable<Tabs.Tab['id']>; type: TaskTypes };
}

export interface StartTaskRequest {
  type: RequestTypes.StartTask;
  action: TaskTypes;
}

export interface FinishTaskRequest {
  type: RequestTypes.FinishTask;
}

export interface CancelTaskRequest {
  type: RequestTypes.CancelTask;
}
