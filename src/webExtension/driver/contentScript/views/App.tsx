import browser from 'webextension-polyfill';
import { observer } from 'mobx-react-lite';

import ConfigService from 'service/ConfigService';
import ClipService from 'service/ClipService';
import { getRemoteApi } from 'infra/remoteApi';
import type MainApp from 'infra/MainApp';

import Modal from './Modal';
import ScreenCapture from './ScreenCapture';
import ElementSelector from './ElementSelector';
import Loading from './Loading';
import Context from './Context';

const ctx = { clipService: new ClipService(), configService: new ConfigService(getRemoteApi<MainApp>()) };
const styleUrl = browser.runtime.getURL('content-script/style.css');

export default observer(function App() {
  return (
    <Context.Provider value={ctx}>
      <link rel="stylesheet" href={styleUrl}></link>
      <Modal />
      <Loading />
      <ScreenCapture />
      <ElementSelector />
    </Context.Provider>
  );
});
