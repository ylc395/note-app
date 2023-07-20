import { exposeApi } from 'infra/remoteApi';
import ClipService from 'service/ClipService';
import WebPageService from 'service/WebPageService';

import Previewer from './Previewer';
import 'tailwindcss/tailwind.css';

const clipService = new ClipService();

new Previewer(clipService);

exposeApi(WebPageService);
