import { observer } from 'mobx-react-lite';
import { Breadcrumb as AntdBreadcrumb } from 'antd';
import { BookOutlined } from '@ant-design/icons';

import type NoteEditor from 'model/note/Editor';
import IconTitle from 'web/components/common/IconTitle';

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
                  items: pathNode.siblings.map(({ id, icon, title }) => ({
                    label: <IconTitle icon={icon} title={`${__ENV__ === 'dev' ? `${id} ` : ''}${title}`} size="1em" />,
                    key: id,
                  })),
                }
              : undefined
          }
        >
          <IconTitle
            title={`${__ENV__ === 'dev' ? `${pathNode.id} ` : ''}${
              i === breadcrumbs.length - 1 ? '当前笔记' : pathNode.title
            }`}
            icon={pathNode.icon}
            className="inline-flex"
            size="1em"
          />
        </AntdBreadcrumb.Item>
      ))}
    </AntdBreadcrumb>
  );
});
