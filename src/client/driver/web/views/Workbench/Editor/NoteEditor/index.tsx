import { useLocalObservable } from 'mobx-react-lite';
import { observable, runInAction } from 'mobx';
import { useEffect } from 'react';

import type NoteEditorModel from 'model/note/EditorView';
import Modal from 'web/components/Modal';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';
import Info from './Info';
import Context, { type EditorContext } from './Context';
import useModal from 'web/components/Modal/useModal';

// eslint-disable-next-line mobx/missing-observer
export default function NoteEditor({ editorView }: { editorView: NoteEditorModel }) {
  const infoModal = useModal();
  const context = useLocalObservable<EditorContext>(
    () => ({
      editorView,
      infoModal,
    }),
    {
      editorView: observable.ref,
    },
  );

  useEffect(() => {
    runInAction(() => {
      context.editorView = editorView;
    });
  }, [context, editorView]);

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
}
