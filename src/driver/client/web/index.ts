import { render } from 'solid-js/web';
import '#domain/client/shared/infra/mobx';
import '#domain/client/shared/infra/queryClient';
import '#domain/client/shared/infra/solid-mobx';

import { token as loggerToken } from '#domain/shared/infra/logger';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as documentDbToken } from '#domain/client/shared/infra/documentDb';
import { token as localStorageToken } from '#domain/client/shared/infra/kvStorage';
import { token as imageResizerToken } from '#domain/shared/infra/imageResizer';
import container from '#utils/singletonContainer';

import NoteService from '#domain/client/app/service/NoteService';

import webKvlStorage from './infra/kvStorage';
import webImageResizer from './infra/imageResizer';
import indexedDb from './infra/indexedDb';
import electronRpc from '../electron/rpcClient';
import App from './view/App';

container.register(loggerToken, console);
container.register(localStorageToken, webKvlStorage);
container.register(documentDbToken, indexedDb);

// 当判断不成立时，esbuild 会把相关语句删去。见 https://esbuild.github.io/api/#drop-labels
if (import.meta.env.VITE_WEB_PLATFORM === 'electron') {
  container.register(rpcToken, electronRpc);
  container.register(imageResizerToken, webImageResizer);
}

// 领域编排
NoteService.boot();

await indexedDb.init();
const appEl = document.getElementById(import.meta.env.VITE_WEB_ROOT_ID)!;
render(App, appEl);
