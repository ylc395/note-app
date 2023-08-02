import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import MainApp from 'infra/MainApp';
import 'utils/mobx';

import App from './views/App';

container.registerInstance(MainApp, new MainApp(true));

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
