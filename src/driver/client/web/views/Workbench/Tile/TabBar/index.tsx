import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { AiOutlineClose } from 'react-icons/ai';

import Button from '#web/components/Button';
import type Tile from '#domain/client/app/model/workbench/Tile';

import TabItem from './TabItem';

export default observer(function TabBar({ tile }: { tile: Tile }) {
  const { editors } = tile;

  return (
    <div className="flex justify-between border-0 border-b border-solid border-layout">
      <div className={clsx('scrollbar-hidden flex grow overflow-auto', 'bg-gray-50')}>
        {editors.map((editor) => (
          <TabItem key={editor.id} editor={editor} />
        ))}
      </div>
      {tile.editors.length > 1 && (
        <Button onClick={tile.destroy}>
          <AiOutlineClose />
        </Button>
      )}
    </div>
  );
});
