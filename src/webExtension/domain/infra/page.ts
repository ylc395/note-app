import type { InjectionToken } from 'tsyringe';
import type { RemoteCallable, RemoteId } from './remoteApi';
import type { Tabs } from 'webextension-polyfill';

interface Page extends RemoteCallable {
  ready?: () => Promise<void>;
  captureScreen: () => Promise<string>;
}

export const REMOTE_ID: RemoteId<Page> = 'page';

export interface PageFactory {
  (tabId?: Tabs.Tab['id']): Page;
}

export const token: InjectionToken<PageFactory> = Symbol();
