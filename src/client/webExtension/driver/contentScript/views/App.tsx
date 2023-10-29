import browser from 'webextension-polyfill';

import Modal from './Modal';
import ScreenCapture from './ScreenCapture';
import ElementSelector from './ElementSelector';
import Loading from './Loading';
import Feedback from './Feedback';
import './index.css';

const styleUrl = browser.runtime.getURL('content-script/style.css');

// eslint-disable-next-line mobx/missing-observer
export default function App() {
  return (
    <>
      <link rel="stylesheet" href={styleUrl}></link>
      <Modal />
      <Loading />
      <ScreenCapture />
      <ElementSelector />
      <Feedback />
    </>
  );
}
