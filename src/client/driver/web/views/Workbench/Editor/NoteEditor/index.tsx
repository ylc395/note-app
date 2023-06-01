import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { useCreation } from 'ahooks';
import { Modal } from 'antd';

import type NoteEditor from 'model/note/Editor';
import MarkdownEditor, { type EditorView } from 'web/components/MarkdownEditor';
import { useModal, COMMON_MODAL_OPTIONS } from 'web/infra/ui';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';
import Info from './Info';
import Context from './Context';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  // const { lint } = container.resolve(MarkdownService);

  // useDebounceEffect(
  //   () => {
  //     lint(editor);
  //   },
  //   [editor, lint],
  //   { wait: 1000 },
  // );

  const onChange = useCallback((content: string) => editor.updateBody(content, true), [editor]);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const infoModal = useModal();
  const editorViewNode = useCreation(() => <MarkdownEditor ref={setEditorView} onChange={onChange} />, [onChange]);

  return (
    <Context.Provider value={{ editor, editorView: editorView, infoModal }}>
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
