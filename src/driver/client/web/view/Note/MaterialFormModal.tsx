import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import Modal from '#web/components/Modal';

export default function MaterialFormModal() {
  const noteService = container.resolve(NoteService);

  return (
    <Modal title="创建素材" open={Boolean(noteService.materialFrom)} onClose={noteService.toggleMaterialForm}>
      <h1>aaa</h1>
    </Modal>
  );
}
