import { createRoot } from 'react-dom/client';
import { exposeApi } from 'infra/remoteApi';
import WebPageService from 'service/WebPageService';
import App from './view/App';

const root = createRoot(WebPageService.createAppRoot());
root.render(<App />);

exposeApi(WebPageService);
