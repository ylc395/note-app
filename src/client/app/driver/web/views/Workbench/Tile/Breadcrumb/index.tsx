import assert from 'assert';
import { observer } from 'mobx-react-lite';
import { RightOutlined } from '@ant-design/icons';

import type { Tile } from '@domain/model/workbench';
import IconTitle from '@components/IconTitle';
import TypeIcon from '@components/TypeIcon';

export default observer(function Breadcrumb({ tile }: { tile: Tile }) {
  const editor = tile.currentEditor;
  assert(editor);

  const { entityType } = editor.getEntityLocator();

  return (
    <ul className="scrollbar-thin m-0 flex items-center shrink-0 list-none overflow-auto border-0 border-b border-solid border-gray-200 px-2 py-1 text-sm text-gray-500">
      <li className="mr-1 flex">
        <TypeIcon type={entityType} />
        <RightOutlined className="ml-1" />
      </li>
      {editor.breadcrumbs.map(({ id, title, icon }) => (
        <li key={id} className="mr-1 flex cursor-pointer items-center">
          <IconTitle icon={icon} title={title} className="mr-1" />
          <RightOutlined />
        </li>
      ))}
      <li className="cursor-pointer">
        <IconTitle icon={editor.tabView.icon} title={editor.tabView.title} />
      </li>
    </ul>
  );
});
