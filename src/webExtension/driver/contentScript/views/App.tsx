import browser from 'webextension-polyfill';
import { observer } from 'mobx-react-lite';

import ConfigService from 'service/ConfigService';
import ClipService from 'service/ClipService';

import Modal from './Modal';
import ScreenCapture from './ScreenCapture';
import ElementSelector from './ElementSelector';
import Loading from './Loading';

const styleUrl = browser.runtime.getURL('content-script/style.css');

export default observer(function App() {
  return (
    <>
      <link rel="stylesheet" href={styleUrl}></link>
      <Modal />
      <Loading />
      <ScreenCapture />
      <ElementSelector />
    </>
  );
});
