import 'reflect-metadata';
import { createApp } from 'vue';
import App from './App.vue';

declare global {
  interface Window {
    electronIpc: {
      request: (data: any) => Promise<any>;
    };
  }
}

createApp(App).mount('#app');
