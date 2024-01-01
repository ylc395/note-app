import type NoteEditor from '@domain/app/model/note/Editor';
// import Modal from '@web/components/Modal';

import Body from './Body';
import Title from './Title';
// import Info from './Info';

// eslint-disable-next-line mobx/missing-observer
export default function NoteEditorView({ editor }: { editor: NoteEditor }) {
  return (
    <div className="flex h-full flex-col">
      <Title editor={editor} />
      <Body editor={editor} />
      {/* <Modal title="详情" closable open={infoModal.isOpen}>
          <Info />
        </Modal> */}
    </div>
  );
}
