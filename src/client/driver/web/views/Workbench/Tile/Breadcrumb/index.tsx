import assert from 'assert';
import { observer } from 'mobx-react-lite';
import { AiOutlineClose, AiOutlineRight } from 'react-icons/ai';

import type { Tile } from '@domain/app/model/workbench';
import IconTitle from '@web/components/IconTitle';
import TypeIcon from '@web/components/TypeIcon';
import Button from '@web/components/Button';

export default observer(function Breadcrumb({ tile }: { tile: Tile }) {
  const editor = tile.currentEditor;
  assert(editor);

  return (
    <div className="flex border-0 border-b border-solid border-gray-200">
      <ul className="scrollbar-thin m-0 flex grow list-none items-center space-x-1 overflow-auto px-2 py-1 text-sm text-gray-500">
        <li className="flex">
          <TypeIcon type={editor.entityLocator.entityType} />
          <AiOutlineRight />
        </li>
        {editor.tabView.breadcrumbs.map(({ id, title, icon }) => (
          <li key={id} className="flex cursor-pointer items-center">
            <IconTitle icon={icon} title={title} className="mr-1" />
            <AiOutlineRight />
          </li>
        ))}
        <li>
          <IconTitle iconSize="1em" icon={editor.tabView.icon} title={editor.tabView.title} />
        </li>
      </ul>
      {tile.editors.length === 1 && (
        <Button onClick={tile.closeAllEditors}>
          <AiOutlineClose />
        </Button>
      )}
    </div>
  );
});
