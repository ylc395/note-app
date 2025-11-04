import { FileUpload, Field } from '@ark-ui/solid';
import { For, Show } from 'solid-js/web';
import assert from 'assert';
import { last } from 'lodash-es';
import { FileIcon, FilePlusIcon, XIcon } from 'lucide-solid';
import { createMemo } from 'solid-js';

import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';
import Modal from '#web/components/common/Modal';

export default function MaterialFormModal() {
  const noteService = container.resolve(NoteService);
  const duplicatedNotes = createMemo(() => noteService.newMaterialForm?.duplicatedNotesQuery.result.data || []);

  async function handleFileSelected(file?: File) {
    assert(noteService.newMaterialForm);
    noteService.newMaterialForm.setFile(
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
      open={Boolean(noteService.newMaterialForm)}
      onClose={noteService.toggleMaterialForm}
      closeOnInteractOutside={false}
      confirmText="创 建"
      canConfirm={!noteService.newMaterialForm?.isValid}
      onConfirm={() => noteService.newMaterialForm?.submit()}
      onCancel={() => noteService.toggleMaterialForm()}
    >
      <form class="space-y-4 form">
        <Field.Root>
          <Field.Label>位于</Field.Label>
          <span class="text-sm" title={noteService.newMaterialForm?.path?.map(({ title }) => title).join('/')}>
            {last(noteService.newMaterialForm?.path)?.title || '根目录'}
          </span>
        </Field.Root>
        <Field.Root>
          <Field.Label>标题</Field.Label>
          <Field.Input
            class="input"
            value={noteService.newMaterialForm?.get('title') ?? ''}
            onInput={(e) => noteService.newMaterialForm?.set('title', e.target.value)}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>来源 URL </Field.Label>
          <Field.Input class="input" />
        </Field.Root>
        <Field.Root>
          <Field.Label>语言</Field.Label>
          <Field.Input class="input" />
        </Field.Root>
        <Field.Root>
          <Field.Label class="self-start required">文件</Field.Label>
          <div>
            <FileUpload.Root
              class="border border-border-primary rounded-lg h-36  text-text-secondary flex items-center justify-center"
              onFileChange={({ acceptedFiles: [file] }) => handleFileSelected(file)}
            >
              <Show
                when={noteService.newMaterialForm?.hasFile}
                fallback={
                  <FileUpload.Dropzone class="text-sm w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <FileUpload.Trigger class="flex items-center justify-center flex-col">
                      <FilePlusIcon class="w-10 h-10 mb-stack-s stroke-1" />
                      <p>点击上传文件</p>
                      <p>可拖拽至此</p>
                    </FileUpload.Trigger>
                  </FileUpload.Dropzone>
                }
              >
                <FileUpload.ItemGroup class="text-sm">
                  <FileUpload.Context>
                    {(file) => (
                      <For each={file().acceptedFiles}>
                        {(item) => (
                          <FileUpload.Item file={item}>
                            <FileUpload.ItemPreview type="image/*">
                              <FileUpload.ItemPreviewImage />
                            </FileUpload.ItemPreview>
                            <FileUpload.ItemPreview class="mb-stack-md">
                              <FileIcon class="mx-auto w-10 h-10 stroke-1" />
                            </FileUpload.ItemPreview>
                            <div class="flex items-center justify-center space-x-stack-s">
                              <div class="flex items-center">
                                <FileUpload.ItemName
                                  title={item.name}
                                  class="max-w-42 whitespace-nowrap overflow-hidden text-ellipsis"
                                />
                                <FileUpload.ItemSizeText class="text-text-tertiary" />
                              </div>
                              <FileUpload.ItemDeleteTrigger class="button button-square-tiny">
                                <XIcon />
                              </FileUpload.ItemDeleteTrigger>
                            </div>
                          </FileUpload.Item>
                        )}
                      </For>
                    )}
                  </FileUpload.Context>
                </FileUpload.ItemGroup>
              </Show>
              <FileUpload.HiddenInput />
            </FileUpload.Root>
            <Field.HelperText
              aria-hidden={duplicatedNotes().length === 0}
              class={`flex mt-stack-s ${duplicatedNotes().length === 0 ? 'invisible' : ''}`}
            >
              该文件已在库中
            </Field.HelperText>
          </div>
        </Field.Root>
      </form>
    </Modal>
  );
}
