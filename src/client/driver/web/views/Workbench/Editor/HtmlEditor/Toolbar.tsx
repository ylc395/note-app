import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import ctx from './Context';

export default observer(function Toolbar() {
  const { htmlViewer } = useContext(ctx);

  return (
    <div className="relative border-0 border-b border-solid border-gray-200 shadow-sm">
      <h2 className="m-0 py-2 text-center text-sm font-normal text-gray-400">{htmlViewer?.title.text}</h2>
    </div>
  );
});
