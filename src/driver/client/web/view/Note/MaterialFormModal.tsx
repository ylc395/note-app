import { FileUpload, Field } from '@ark-ui/solid';
import { For } from 'solid-js/web';

import NoteService from '#domain/client/app/service/NoteService';
import { container } from '#domain/shared/infra/singletons';
import Modal from '#web/components/Modal';

export default function MaterialFormModal() {
  const noteService = container.resolve(NoteService);

  async function uploadFile(file?: File) {
    noteService.materialForm?.handleFileSelected(
      file && {
        path: window.electronUtils?.getFilePath(file),
        data: await file.arrayBuffer(),
        mimeType: file.type,
      },
    );
  }

  return (
    <Modal title="创建素材" open={Boolean(noteService.materialForm)} onClose={noteService.toggleMaterialForm}>
      <form>
        <Field.Root>
          <Field.Label>标题</Field.Label>
          <Field.Input onInput={(e) => noteService.materialForm?.set('title', e.target.value)} />
        </Field.Root>
        <Field.Root>
          <Field.Label>来源（URL）</Field.Label>
          <Field.Input />
        </Field.Root>
        <Field.Root>
          <FileUpload.Root onFileChange={({ acceptedFiles: [file] }) => uploadFile(file)}>
            <FileUpload.Label>上传本地文件</FileUpload.Label>
            <FileUpload.Dropzone>可拖拽至此</FileUpload.Dropzone>
            <FileUpload.Trigger>点击选择</FileUpload.Trigger>
            <FileUpload.ItemGroup>
              <FileUpload.Context>
                {(context) => (
                  <For each={context().acceptedFiles}>
                    {(file) => (
                      <FileUpload.Item file={file}>
                        <FileUpload.ItemPreview type="image/*">
                          <FileUpload.ItemPreviewImage />
                        </FileUpload.ItemPreview>
                        <FileUpload.ItemPreview type=".*">Any Icon</FileUpload.ItemPreview>
                        <FileUpload.ItemName />
                        <FileUpload.ItemSizeText />
                        <FileUpload.ItemDeleteTrigger>X</FileUpload.ItemDeleteTrigger>
                      </FileUpload.Item>
                    )}
                  </For>
                )}
              </FileUpload.Context>
            </FileUpload.ItemGroup>
            <FileUpload.HiddenInput />
          </FileUpload.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>备注</Field.Label>
          <Field.Textarea />
        </Field.Root>
      </form>
      <div>
        <button disabled={!noteService.materialForm?.isValid} onClick={() => noteService.materialForm?.submit()}>
          创建
        </button>
      </div>
    </Modal>
  );
}
