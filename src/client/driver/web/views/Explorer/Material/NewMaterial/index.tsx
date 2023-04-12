import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import Menu from './Menu';
import { ModalContext } from '../useModals';

export default observer(function NewMaterial() {
  const { creating } = useContext(ModalContext);

  return (
    <div>
      <Menu />
    </div>
  );
});
