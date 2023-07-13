import type { Tabs } from 'webextension-polyfill';

export const TASK_ID_PREFIX = 'task-id-';

export interface Task {
  id: string;
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
