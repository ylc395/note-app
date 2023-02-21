import { observer } from 'mobx-react-lite';
import { Breadcrumb as AntdBreadcrumb } from 'antd';
import { BookOutlined } from '@ant-design/icons';

import type NoteEditor from 'model/editor/NoteEditor';
import NoteIconTitle from 'web/components/note/IconTitle';

export default observer(function Breadcrumb({ editor }: { editor: NoteEditor }) {
  const breadcrumbs = editor.breadcrumbs;

  return (
    <AntdBreadcrumb className="px-3 py-2">
      <AntdBreadcrumb.Item>
        <BookOutlined />
      </AntdBreadcrumb.Item>
      {breadcrumbs.map((pathNode, i) => (
        <AntdBreadcrumb.Item
          key={pathNode.id}
          menu={
            pathNode.siblings.length
              ? {
                  items: pathNode.siblings.map((sibling) => ({
                    label: <NoteIconTitle {...sibling} size="1em" />,
                    key: sibling.id,
                  })),
                }
              : undefined
          }
        >
          <NoteIconTitle
            title={i === breadcrumbs.length - 1 ? '当前笔记' : pathNode.title}
            id={pathNode.id}
            icon={pathNode.icon}
            className="inline-flex"
            size="1em"
          />
        </AntdBreadcrumb.Item>
      ))}
    </AntdBreadcrumb>
  );
});
