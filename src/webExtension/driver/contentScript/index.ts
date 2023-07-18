import { exposeApi } from 'domain/infra/remoteApi';
import ClipService from 'domain/service/ClipService';
import WebPageService from 'domain/service/WebPageService';

import Previewer from './Previewer';
import 'tailwindcss/tailwind.css';

const clipService = new ClipService();

new Previewer(clipService);

exposeApi(WebPageService);
