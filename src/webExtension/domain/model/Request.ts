import type { Tabs } from 'webextension-polyfill';
import type { TaskTypes } from './Task';

// todo: always use taskId

export enum RequestTypes {
  QuerySessionTasks = 'QUERY_SESSION_TASKS',
  AddTask = 'ADD_TASK',
  StartTask = 'START_TASK',
  CancelTask = 'CANCEL_TASK',
  Submit = 'Submit',
  FinishTask = 'Finish_TASK',
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

export interface SubmitRequest {
  type: RequestTypes.Submit;
  payload: {
    title: string;
    content: string;
    type: 'md' | 'html';
  };
}

export interface FinishTaskRequest {
  type: RequestTypes.FinishTask;
  tabId: NonNullable<Tabs.Tab['id']>;
}

export interface CancelTaskRequest {
  type: RequestTypes.CancelTask;
  tabId?: NonNullable<Tabs.Tab['id']>;
  error?: string;
}
