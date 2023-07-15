import type { EntityId, EntityTypes } from 'shared/interface/entity';
import type { Tabs } from 'webextension-polyfill';

export interface Task {
  id?: string;
  title: string;
  url: string;
  tabId?: NonNullable<Tabs.Tab['id']>;
  type: TaskTypes;
  time: number;
  targetType: EntityTypes;
  targetId: EntityId | null;
}

export enum TaskTypes {
  SelectElement = 'SELECT_ELEMENT',
  SelectElementText = 'SELECT_ELEMENT_TEXT',
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
  HasSelection = 'HAS_SELECTION',
}

export interface StartTaskEvent {
  task: Task;
}

export interface SubmitEvent {
  title: string;
  taskId: Task['id'];
  content: string;
  contentType: 'md' | 'html';
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

export interface HasSelectionRequest {
  type: RequestTypes.HasSelection;
}

export interface AddTaskRequest {
  type: RequestTypes.AddTask;
  tabId: NonNullable<Tabs.Tab['id']>;
  action: TaskTypes;
}
