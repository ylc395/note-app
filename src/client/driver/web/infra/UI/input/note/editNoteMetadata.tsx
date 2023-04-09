import { Modal } from 'antd';

import type { NoteDomain } from 'infra/UI';
import NoteMetadataForm from 'web/views/Explorer/Note/input/MetadataForm';

import { COMMON_MODAL_OPTIONS } from '../../../userInput/utils';

const editNotes: NoteDomain['editNoteMetadata'] = async (metadata, notesInfo) => {
  return new Promise((resolve) => {
    const modal = Modal.confirm({
      ...COMMON_MODAL_OPTIONS,
      content: (
        <NoteMetadataForm
          metadata={metadata}
          onCancel={() => {
            modal.destroy();
            resolve(undefined);
          }}
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
