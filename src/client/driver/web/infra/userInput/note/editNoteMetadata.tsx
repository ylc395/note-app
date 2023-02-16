import { Modal } from 'antd';

import type { NoteInputs } from 'infra/UserInput';
import NoteMetadataForm from 'web/components/note/MetadataForm';

import { COMMON_MODAL_OPTIONS } from '../utils';

const editNotes: NoteInputs['editNoteMetadata'] = async (metadata, notesInfo) => {
  return new Promise((resolve) => {
    const modal = Modal.confirm({
      ...COMMON_MODAL_OPTIONS,
      footer: null,
      content: (
        <NoteMetadataForm
          metadata={metadata}
          onCancel={() => modal.destroy()}
          icons={notesInfo.icons}
          onSubmit={(data) => {
            resolve(data);
            modal.destroy();
          }}
        />
      ),
      title: `${notesInfo.length > 1 ? '批量' : ''}编辑${notesInfo.length > 1 ? `${notesInfo.length}项` : ''}笔记${
        notesInfo.length === 1 ? `《${notesInfo.title}》` : ''
      }`,
    });
  });
};
export default editNotes;
