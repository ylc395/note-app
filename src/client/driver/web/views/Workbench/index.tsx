import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import { Workbench } from '@domain/app/model/workbench';

import Mosaic from './Mosaic';
import Tile from './Tile';
import TopBar from './TopBar';

export default observer(function WorkbenchView() {
  const { root } = container.resolve(Workbench);

  return (
    <div className="flex h-full min-w-0 grow flex-col overflow-hidden">
      <TopBar />
      <Mosaic root={root} renderTile={(id) => <Tile id={id} />}>
        <div className="h-full">空空如也</div>
      </Mosaic>
    </div>
  );
});
