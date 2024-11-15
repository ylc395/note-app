import { createRoot } from 'react-dom/client';
import assert from 'assert';
import '#domain/client/shared/infra/mobx';

import { token as uiToken } from '#domain/shared/infra/ui/common';
import { token as loggerToken } from '#domain/shared/infra/logger';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { token as localStorageToken } from '#domain/client/app/infra/localStorage';
import { APP_NAME } from '#domain/shared/infra/constants';
import { container } from '#domain/shared/infra/singletons';

import ui from './infra/ui';
import webLocalStorage from './infra/localStorage';
import App from './views/App';
import electronRpc from '../electron/rpc';

container.register(uiToken, { useValue: ui });
container.register(rpcToken, { useValue: window.IS_ELECTRON ? electronRpc : null });
container.register(loggerToken, { useValue: console });
container.register(localStorageToken, { useValue: webLocalStorage });

const appEl = document.querySelector('#app') as HTMLElement | null;
assert(appEl);

appEl.className = APP_NAME;
appEl.style.userSelect = 'none';

const root = createRoot(appEl);
root.render(<App />);
