import { useLocalObservable } from 'mobx-react-lite';
import { observable, runInAction } from 'mobx';
import { useEffect } from 'react';

import type NoteEditor from '@domain/model/note/Editor';
import Modal from '@components/Modal';

import Body from './Body';
import Title from './Title';
import Info from './Info';
import Context, { type EditorContext } from './Context';
import useModal from '@components/Modal/useModal';

// eslint-disable-next-line mobx/missing-observer
export default function NoteEditorView({ editor }: { editor: NoteEditor }) {
  const infoModal = useModal();
  const context = useLocalObservable<EditorContext>(() => ({ editor, infoModal }), { editor: observable.ref });

  useEffect(() => {
    runInAction(() => {
      context.editor = editor;
    });
  }, [context, editor]);

  return (
    <Context.Provider value={context}>
      <div className="flex h-full flex-col">
        <Title />
        <Body />
        <Modal title="详情" closable open={infoModal.isOpen}>
          <Info />
        </Modal>
      </div>
    </Context.Provider>
  );
}
