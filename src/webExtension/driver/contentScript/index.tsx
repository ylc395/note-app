import { createRoot } from 'react-dom/client';
import 'tailwindcss/tailwind.css';

import { exposeApi } from 'infra/remoteApi';
import WebPageService from 'service/WebPageService';
import App from './views/App';

const root = createRoot(WebPageService.createAppRoot());
root.render(<App />);

exposeApi(WebPageService);
