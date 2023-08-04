import browser from 'webextension-polyfill';

import Modal from './Modal';
import ScreenCapture from './ScreenCapture';
import ElementSelector from './ElementSelector';
import Loading from './Loading';

const styleUrl = browser.runtime.getURL('content-script/style.css');

export default function App() {
  return (
    <>
      <link rel="stylesheet" href={styleUrl}></link>
      <Modal />
      <Loading />
      <ScreenCapture />
      <ElementSelector />
    </>
  );
}
