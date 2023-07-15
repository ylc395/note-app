import { exposeApi } from 'domain/infra/remoteApi';
import ClipService from 'domain/service/ClipService';

exposeApi(ClipService);
new ClipService();
