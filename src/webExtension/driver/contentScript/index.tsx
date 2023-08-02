import { createRoot } from 'react-dom/client';
import 'tailwindcss/tailwind.css';

import { exposeApi } from 'infra/remoteApi';
import WebPageService from 'service/WebPageService';
import 'utils/mobx';

import App from './views/App';

WebPageService.pageReady().then(() => {
  const root = createRoot(WebPageService.createAppRoot());
  root.render(<App />);
});

exposeApi(WebPageService);
