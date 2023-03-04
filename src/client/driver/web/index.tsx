import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';

import { token as remoteToken } from 'infra/Remote';
import { token as userFeedbackToken } from 'infra/UserFeedback';
import { token as userInputToken } from 'infra/UserInput';

import { httpClient, ipcClient } from './infra/httpClient';
import userFeedback from './infra/userFeedback';
import userInput from './infra/userInput';
import App from './views/App';
import DraggableZone from './views/DraggableZone';

container.registerInstance(remoteToken, ipcClient || httpClient);
container.registerInstance(userFeedbackToken, userFeedback);
container.registerInstance(userInputToken, userInput);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(
  <DraggableZone>
    <App />
  </DraggableZone>,
);
