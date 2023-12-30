import assert from 'assert';
import { observer } from 'mobx-react-lite';
import { RightOutlined } from '@ant-design/icons';

import type { Tile } from '@domain/app/model/workbench';
import IconTitle from '@web/components/IconTitle';
import TypeIcon from '@web/components/TypeIcon';

export default observer(function Breadcrumb({ tile }: { tile: Tile }) {
  const editor = tile.currentEditor;
  assert(editor);

  return (
    <ul className="scrollbar-thin m-0 flex shrink-0 list-none items-center overflow-auto border-0 border-b border-solid border-gray-200 px-2 py-1 text-sm text-gray-500">
      <li className="mr-1 flex">
        <TypeIcon type={editor.entityLocator.entityType} />
        <RightOutlined className="ml-1" />
      </li>
      {editor.tabView.breadcrumbs.map(({ id, title, icon }) => (
        <li key={id} className="mr-1 flex cursor-pointer items-center">
          <IconTitle icon={icon} title={title} className="mr-1" />
          <RightOutlined />
        </li>
      ))}
      <li>
        <IconTitle iconSize="1em" icon={editor.tabView.icon} title={editor.tabView.title} />
      </li>
    </ul>
  );
});
