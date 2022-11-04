import 'reflect-metadata';
import { createApp } from 'vue';
import { container } from 'tsyringe';

import { token as remoteToken } from 'infra/Remote';
import { httpClient, ipcClient } from './utils/httpClient';

import App from './App.vue';

container.registerInstance(remoteToken, ipcClient || httpClient);

// @see https://www.naiveui.com/zh-CN/os-theme/docs/style-conflict
const meta = document.createElement('meta');
meta.name = 'naive-ui-style';
document.head.appendChild(meta);
createApp(App).mount('#app');
