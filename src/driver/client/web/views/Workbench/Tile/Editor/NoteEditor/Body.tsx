import { observer } from 'mobx-react-lite';
import type NoteEditor from '#domain/client/app/model/note/editor/BaseEditor';

export default observer(function Body({ editor }: { editor: NoteEditor }) {
  return <div className="relative min-h-0 grow px-4">{editor.view.body}</div>;
});
