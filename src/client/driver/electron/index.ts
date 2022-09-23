import { App } from './App';
import reloader from 'electron-reloader';

reloader(module, { watchRenderer: false, debug: true });

const myApp = new App();
myApp.start();
