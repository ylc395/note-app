import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { useCreation } from 'ahooks';
import { Modal } from 'antd';

import type NoteEditor from 'model/note/EditorView';
import MarkdownEditor, { type EditorView as MarkdownEditorView } from 'web/components/MarkdownEditor';
import { useModal, COMMON_MODAL_OPTIONS } from 'web/infra/ui';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';
import Info from './Info';
import Context from './Context';

export default observer(function NoteEditor({ editorView }: { editorView: NoteEditor }) {
  const [markdownEditorView, setMarkdownEditorView] = useState<MarkdownEditorView | null>(null);
  const onChange = useCallback((content: string) => editorView.editor.updateBody(content), [editorView]);
  const infoModal = useModal();
  const editorViewNode = useCreation(
    () => <MarkdownEditor ref={setMarkdownEditorView} onChange={onChange} />,
    [onChange],
  );

  return (
    <Context.Provider value={{ editorView, markdownEditorView, infoModal }}>
      <div className="flex h-full flex-col">
        <Title />
        <Breadcrumb />
        <Body>{editorViewNode}</Body>
        <Modal {...COMMON_MODAL_OPTIONS} title="详情" closable open={infoModal.isOpen} onCancel={infoModal.close}>
          <Info />
        </Modal>
      </div>
    </Context.Provider>
  );
});
