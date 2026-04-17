import { createMemo, For, Show } from 'solid-js';
import { FileUpload } from '@ark-ui/solid';
import { FileIcon, FilePlusIcon, XIcon } from 'lucide-solid';

import Modal from '#web/view/components/Modal';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';

export default function CustomIconPicker() {
  const { explorer } = container.resolve(NoteService);
  const iconPicker = explorer.iconPicker;

  const customIconPickerModel = createMemo(() => {
    return iconPicker.customIconPicker;
  });

  async function handleFileSelected(file?: File) {
    customIconPickerModel()?.set(file && { mimeType: file.type, data: await file.arrayBuffer() });
  }

  return (
    <Modal
      title="新建图标"
      open={Boolean(iconPicker.customIconPicker)}
      confirmText="创建并使用"
      canConfirm={!customIconPickerModel()?.canSubmit}
      onConfirm={() => customIconPickerModel()?.submit()}
      onCancel={() => iconPicker.customIconPicker?.destroy()}
      onClose={() => iconPicker.customIconPicker?.destroy()}
    >
      <div class="mt-6 text-right space-x-4 flex justify-end">
        <FileUpload.Root
          class="border border-border-primary rounded-lg h-36  text-fg-secondary flex items-center justify-center"
          onFileChange={({ acceptedFiles: [file] }) => handleFileSelected(file)}
        >
          <Show
            when={customIconPickerModel()?.icon}
            fallback={
              <FileUpload.Dropzone class="text-sm w-full h-full flex flex-col items-center justify-center cursor-pointer">
                <FileUpload.Trigger class="flex items-center justify-center flex-col">
                  <FilePlusIcon class="w-10 h-10 mb-2 stroke-1" />
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
                        <FileUpload.ItemPreview class="mb-4">
                          <FileIcon class="mx-auto w-10 h-10 stroke-1" />
                        </FileUpload.ItemPreview>
                        <div class="flex items-center justify-center space-x-2">
                          <div class="flex items-center">
                            <FileUpload.ItemName
                              title={item.name}
                              class="max-w-42 whitespace-nowrap overflow-hidden text-ellipsis"
                            />
                            <FileUpload.ItemSizeText class="text-fg-tertiary" />
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
      </div>
    </Modal>
  );
}
