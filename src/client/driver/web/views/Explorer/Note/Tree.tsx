import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useEffect } from 'react';

import NoteService from 'service/NoteService';
import WorkbenchService from 'service/WorkbenchService';

export default observer(function NoteTree() {
  const { notes, fetchNotes } = container.resolve(NoteService);
  const { open } = container.resolve(WorkbenchService);

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div>
      {notes.map((note) => (
        <div key={note.id} onClick={() => open({ type: 'note', entity: note }, true)}>
          {note.id} {note.title}
        </div>
      ))}
    </div>
  );
});
