import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import NoteService from 'service/NoteService';

import Tree from './Tree';

export default observer(function NoteExplorer() {
  const { createNote } = container.resolve(NoteService);

  return (
    <div className="flex">
      <div>
        <div>笔记</div>
        <div>
          <button onClick={createNote}>add</button>
        </div>
      </div>
      <Tree />
    </div>
  );
});
