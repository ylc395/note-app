import { REMOTE_ID as PAGE_REMOTE_ID, PageFactory } from 'infra/page';
import { getRemoteApi } from 'infra/remoteApi';

export const getPage: PageFactory = (tabId) => getRemoteApi(PAGE_REMOTE_ID, tabId);
