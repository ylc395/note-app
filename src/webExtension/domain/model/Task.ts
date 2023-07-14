import type { Tabs } from 'webextension-polyfill';

export interface Task {
  id?: string;
  title: string;
  url: string;
  tabId?: NonNullable<Tabs.Tab['id']>;
  type: TaskTypes;
  time: number;
}

export enum TaskTypes {
  SelectElement = 'SELECT_ELEMENT',
  SelectPage = 'SELECT_PAGE',
  ExtractText = 'EXTRACT_TEXT',
  ExtractSelection = 'EXTRACT_SELECTION',
  ScreenShot = 'SCREENSHOT',
}

export enum EventNames {
  StartTask = 'START_TASK',
  CancelTask = 'CANCEL_TASK',
  Submit = 'Submit',
  FinishTask = 'Finish_TASK',
}

export enum RequestTypes {
  QuerySessionTask = 'QUERY_SESSION_TASK',
  AddTask = 'ADD_TASK',
}

export interface StartTaskEvent {
  task: Task;
}

export interface SubmitEvent {
  title: string;
  taskId: Task['id'];
  content: string;
  type: 'md' | 'html';
}

export interface FinishEvent {
  taskId: Task['id'];
}

export interface CancelEvent {
  taskId: Task['id'];
  error?: string;
}

export interface QueryTaskRequest {
  type: RequestTypes.QuerySessionTask;
}

export interface AddTaskRequest {
  type: RequestTypes.AddTask;
  tabId: NonNullable<Tabs.Tab['id']>;
  action: TaskTypes;
}
