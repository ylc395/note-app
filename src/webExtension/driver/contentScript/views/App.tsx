import browser from 'webextension-polyfill';
import ClipService from 'service/ClipService';
import { observer } from 'mobx-react-lite';

import Modal from './Modal';
import ScreenCapture from './ScreenCapture';
import ElementSelector from './ElementSelector';
import Context from './Context';

const ctx = { clipService: new ClipService() };
const styleUrl = browser.runtime.getURL('content-script/style.css');

export default observer(function App() {
  return (
    <Context.Provider value={ctx}>
      <link rel="stylesheet" href={styleUrl}></link>
      <Modal />
      <ScreenCapture />
      <ElementSelector />
    </Context.Provider>
  );
});
