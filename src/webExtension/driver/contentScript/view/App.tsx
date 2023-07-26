import ClipService from 'service/ClipService';

import Modal from './Modal';
import ScreenCapture from './ScreenCapture';
import ElementSelector from './ElementSelector';
import Context from './Context';

const ctx = { clipService: new ClipService() };

export default function App() {
  return (
    <Context.Provider value={ctx}>
      <Modal />
      <ScreenCapture />
      <ElementSelector />
    </Context.Provider>
  );
}
