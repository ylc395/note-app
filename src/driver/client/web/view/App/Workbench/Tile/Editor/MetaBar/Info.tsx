import { createMemo } from 'solid-js';
import dayjs from 'dayjs';
import { Popover } from '@ark-ui/solid';

import EditorFactory from '#domain/client/app/model/Workbench/EditorFactory';
import { useContext } from '../composables';

export default function Info() {
  const ctx = useContext()!;

  const editor = createMemo(() => {
    EditorFactory.assertIsEditor(ctx.editor);
    return ctx.editor;
  });

  return (
    <Popover.Content
      asChild={(props) => (
        <dl {...props()}>
          <div>
            <dt>ID</dt>
            <dd>{ctx.editor.entityId}</dd>
          </div>
          <div>
            <dt>字数</dt>
            <dd>{editor().entity.pureTextWordCount}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{dayjs(editor().entity.value.data!.createdAt).format('YYYY-MM-DD HH:mm:ss')}</dd>
          </div>
          <div>
            <dt>最后修改时间</dt>
            <dd>{dayjs(editor().entity.value.data!.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</dd>
          </div>
        </dl>
      )}
    />
  );
}
