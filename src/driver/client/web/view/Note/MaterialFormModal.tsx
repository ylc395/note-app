import { FileUpload, Field } from '@ark-ui/solid';
import { For } from 'solid-js/web';
import assert from 'assert';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import Modal from '#web/components/Modal';

export default function MaterialFormModal() {
  const noteService = container.resolve(NoteService);

  async function uploadFile(file?: File) {
    assert(noteService.materialForm);
    noteService.materialForm.handleFileSelected(
      file && {
        path: window.electronUtils?.getFilePath(file),
        data: await file.arrayBuffer(),
        mimeType: file.type,
        name: file.name,
      },
    );
  }

  return (
    <Modal
      title="创建素材"
      open={Boolean(noteService.materialForm)}
      onClose={noteService.toggleMaterialForm}
      closeOnInteractOutside={false}
    >
      <div>
        位于<span class="italic">{noteService.materialForm?.parent?.title ?? '根目录'}</span>下
      </div>
      <form class="space-y-4">
        <Field.Root>
          <Field.Label>标题</Field.Label>
          <Field.Input
            class="border"
            value={noteService.materialForm?.get('title') ?? ''}
            onInput={(e) => noteService.materialForm?.set('title', e.target.value)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>来源（URL）</Field.Label>
          <Field.Input class="border" />
        </Field.Root>
        <Field.Root>
          <Field.Label>语言</Field.Label>
          <Field.Input class="border" />
        </Field.Root>
        <Field.Root>
          <FileUpload.Root class="border text-center" onFileChange={({ acceptedFiles: [file] }) => uploadFile(file)}>
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
      </form>
      <div class="mt-4 text-right space-x-4">
        <button onClick={() => noteService.toggleMaterialForm()}>取消</button>
        <button disabled={!noteService.materialForm?.isValid} onClick={() => noteService.materialForm?.submit()}>
          创建
        </button>
      </div>
    </Modal>
  );
}
