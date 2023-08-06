import browser from 'webextension-polyfill';
import { container } from 'tsyringe';

import ClipService from 'service/ClipService';

import Modal from './Modal';
import ScreenCapture from './ScreenCapture';
import ElementSelector from './ElementSelector';
import Loading from './Loading';
import Feedback from './Feedback';
import './index.css';

const styleUrl = browser.runtime.getURL('content-script/style.css');

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
