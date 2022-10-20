import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';

import { type Remote, token as remoteToken } from 'infra/Remote';
import httpClient from './utils/httpClient';

import App from './App.vue';

declare global {
  interface Window {
    electronIpc?: Remote;
  }
}

container.registerInstance(remoteToken, window.electronIpc || httpClient);

createApp(App).mount('#app');
