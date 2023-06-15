import { observer, useLocalObservable } from 'mobx-react-lite';
import { observable, runInAction } from 'mobx';
import { useEffect } from 'react';

import type NoteEditor from 'model/note/EditorView';
import Modal from 'web/components/Modal';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';
import Info from './Info';
import Context, { type EditorContext } from './Context';
import useModal from 'web/components/Modal/useModal';

export default observer(function NoteEditor({ editorView }: { editorView: NoteEditor }) {
  const infoModal = useModal();
  const context = useLocalObservable<EditorContext>(
    () => ({
      editorView,
      markdownEditor: null,
      infoModal,
      setMarkdownEditor(v) {
        this.markdownEditor = v;
      },
    }),
    {
      editorView: observable.ref,
      markdownEditor: observable.ref,
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
});
