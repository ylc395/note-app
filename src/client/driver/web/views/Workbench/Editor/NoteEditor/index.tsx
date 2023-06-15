import { observer, useLocalObservable } from 'mobx-react-lite';

import type NoteEditor from 'model/note/EditorView';
import Modal from 'web/components/Modal';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';
import Info from './Info';
import Context, { type EditorContext } from './Context';
import { observable } from 'mobx';
import useModal from 'web/components/Modal/useModal';

export default observer(function NoteEditor({ editorView }: { editorView: NoteEditor }) {
  const infoModal = useModal();
  const context = useLocalObservable<EditorContext>(
    () => ({
      editorView,
      markdownEditorView: null,
      infoModal,
      setMarkdownEditorView: function (v) {
        this.markdownEditorView = v;
      },
    }),
    {
      editorView: observable.ref,
      markdownEditorView: observable.ref,
    },
  );

  return (
    <Context.Provider value={context}>
      <div className="flex h-full flex-col">
        <Title />
        <Breadcrumb />
        <Body />
        <Modal title="详情" closable open={infoModal.isOpen}>
          <Info />
        </Modal>
      </div>
    </Context.Provider>
  );
});
