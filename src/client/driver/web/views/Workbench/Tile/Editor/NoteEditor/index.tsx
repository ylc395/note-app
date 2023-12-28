import { useLocalObservable } from 'mobx-react-lite';
import { observable, runInAction } from 'mobx';
import { useEffect } from 'react';

import type NoteEditor from '@domain/app/model/note/Editor';
// import Modal from '@web/components/Modal';

import Body from './Body';
import Title from './Title';
// import Info from './Info';
import Context, { type EditorContext } from './Context';

// eslint-disable-next-line mobx/missing-observer
export default function NoteEditorView({ editor }: { editor: NoteEditor }) {
  const context = useLocalObservable<EditorContext>(() => ({ editor }), { editor: observable.ref });

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
        {/* <Modal title="详情" closable open={infoModal.isOpen}>
          <Info />
        </Modal> */}
      </div>
    </Context.Provider>
  );
}
