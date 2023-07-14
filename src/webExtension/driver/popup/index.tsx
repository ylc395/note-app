import 'reflect-metadata';
import { container } from 'tsyringe';
import { createRoot } from 'react-dom/client';
import HttpClient from 'domain/infra/HttpClient';

import App from './view/App';

container.registerInstance(HttpClient, new HttpClient(true));

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.querySelector('#app')!);
root.render(<App />);
