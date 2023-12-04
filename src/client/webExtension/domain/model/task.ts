import type { EntityId, EntityTypes } from '@domain/model/entity';
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

export interface TaskResult {
  title: string;
  content: string;
  contentType: 'md' | 'html' | 'png';
}

export enum TaskTypes {
  SelectElement = 'SELECT_ELEMENT',
  SelectElementText = 'SELECT_ELEMENT_TEXT',
  SelectPage = 'SELECT_PAGE',
  ExtractText = 'EXTRACT_TEXT',
  ScreenShot = 'SCREENSHOT',
}

export enum EventNames {
  StartTask = 'START_TASK',
  CancelTask = 'CANCEL_TASK',
  Submit = 'Submit',
  FinishTask = 'Finish_TASK',
  Preview = 'PREVIEW',
}

export interface StartTaskEvent {
  task: Task;
}

export interface SubmitEvent extends TaskResult {
  taskId: Task['id'];
}

export interface FinishEvent {
  taskId: Task['id'];
}

export interface CancelEvent {
  taskId: Task['id'];
  error?: string;
}
