import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { AiOutlinePlus, AiOutlineShrink, AiOutlineSetting } from 'react-icons/ai';

import NoteService from '@domain/app/service/NoteService';
import Button from '@web/components/Button';
import NoteExplorer from '@domain/app/model/note/Explorer';

export default observer(function Operations() {
  const { createNote } = container.resolve(NoteService);
  const {
    tree: { expandedNodes, collapseAll },
  } = container.resolve(NoteExplorer);

  return (
    <div className="flex grow justify-between">
      <Button onClick={() => createNote()}>
        <AiOutlinePlus />
      </Button>
      <div className="flex">
        <Button disabled={expandedNodes.length === 0} onClick={collapseAll}>
          <AiOutlineShrink />
        </Button>
        <Button>
          <AiOutlineSetting />
        </Button>
      </div>
    </div>
  );
});
