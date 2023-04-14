import { observer } from 'mobx-react-lite';
import { Breadcrumb as AntdBreadcrumb } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useContext } from 'react';

import IconTitle from 'web/components/IconTitle';

import EditorContext from './Context';

export default observer(function Breadcrumb() {
  const { editor } = useContext(EditorContext);
  const breadcrumbs = editor.breadcrumbs;

  return (
    <AntdBreadcrumb
      className="px-3 py-2"
      items={[
        { title: <BookOutlined /> },
        ...breadcrumbs.map((pathNode, i) => ({
          title: (
            <IconTitle
              title={`${__ENV__ === 'dev' ? `${pathNode.id} ` : ''}${
                i === breadcrumbs.length - 1 ? '当前笔记' : pathNode.title
              }`}
              icon={pathNode.icon}
              className="inline-flex"
              size="1em"
            />
          ),
          menu: pathNode.siblings.length
            ? {
                items: pathNode.siblings.map(({ id, icon, title }) => ({
                  label: <IconTitle icon={icon} title={`${__ENV__ === 'dev' ? `${id} ` : ''}${title}`} size="1em" />,
                  key: id,
                })),
              }
            : undefined,
        })),
      ]}
    />
  );
});
