import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { useCreation } from 'ahooks';
import { Modal } from 'antd';

import type NoteEditor from 'model/note/Editor';
import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';
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
  const [editorRef, setEditorRef] = useState<EditorRef | null>(null);
  const infoModal = useModal();
  const editorView = useCreation(() => <MarkdownEditor ref={setEditorRef} onChange={onChange} />, [onChange]);

  return (
    <Context.Provider value={{ editor, editorRef, infoModal }}>
      <div className="flex h-full flex-col">
        <Title />
        <Breadcrumb />
        <Body>{editorView}</Body>
        <Modal {...COMMON_MODAL_OPTIONS} title="详情" closable open={infoModal.isOpen} onCancel={infoModal.close}>
          <Info />
        </Modal>
      </div>
    </Context.Provider>
  );
});
