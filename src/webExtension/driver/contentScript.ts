import { exposeApi } from 'domain/infra/remoteApi';
import ClipService from 'domain/service/ClipService';
import WebPageService from 'domain/service/WebPageService';

new ClipService();
exposeApi(WebPageService);
