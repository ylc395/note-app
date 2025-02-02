import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';

import Tree from './Tree';

export default function NoteExplorer() {
  const { createNote } = container.resolve(NoteService);
  return (
    <div>
      <h2>笔记</h2>
      <div>
        <button onClick={() => createNote()}>新增</button>
      </div>
      <Tree />
    </div>
  );
}
