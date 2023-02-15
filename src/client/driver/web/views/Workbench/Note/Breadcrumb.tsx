import { observer } from 'mobx-react-lite';
import { Breadcrumb as AntdBreadcrumb } from 'antd';
import { BookOutlined } from '@ant-design/icons';

import type NoteEditor from 'model/editor/NoteEditor';
import { Emoji } from 'web/components/Emoji';

export default observer(function Breadcrumb({ editor }: { editor: NoteEditor }) {
  return (
    <div className="flex justify-between">
      <AntdBreadcrumb className="px-3 py-2">
        <AntdBreadcrumb.Item>
          <BookOutlined />
        </AntdBreadcrumb.Item>
        {editor.breadcrumb?.map(({ id, icon, title, siblings }) => (
          <AntdBreadcrumb.Item
            key={id}
            menu={
              siblings.length
                ? {
                    items: siblings.map(({ title, id, icon }) => ({
                      label: (
                        <span>
                          <Emoji id={icon} />
                          {title}
                        </span>
                      ),
                      key: id,
                    })),
                  }
                : undefined
            }
          >
            <Emoji id={icon} /> {title}
          </AntdBreadcrumb.Item>
        ))}
      </AntdBreadcrumb>
    </div>
  );
});
