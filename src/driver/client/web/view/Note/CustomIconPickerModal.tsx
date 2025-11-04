import { createMemo, For, onCleanup, Show, untrack } from 'solid-js';
import { FileUpload } from '@ark-ui/solid';
import { FileIcon, FilePlusIcon, XIcon } from 'lucide-solid';

import Modal from '#web/components/common/Modal';
import NoteService from '#domain/client/app/service/NoteService';
import container from '#utils/singletonContainer';

export default function CustomIconPicker() {
  const { iconPicker } = container.resolve(NoteService);

  const customIconPickerModel = createMemo(() => {
    if (!iconPicker.customIconPickerState.isEnabled) {
      return null;
    }

    const result = untrack(() => iconPicker.createCustomIconPicker());

    onCleanup(() => result.destroy());
    return result;
  });

  async function handleFileSelected(file?: File) {
    customIconPickerModel()?.set(file && { mimeType: file.type, data: await file.arrayBuffer() });
  }

  return (
    <Modal
      title="新建图标"
      open={iconPicker.customIconPickerState.isEnabled}
      confirmText="创建并使用"
      canConfirm={!customIconPickerModel()?.canSubmit}
      onConfirm={() => customIconPickerModel()?.submit()}
      onCancel={iconPicker.customIconPickerState.toggle}
      onClose={iconPicker.customIconPickerState.toggle}
    >
      <div class="mt-stack-lg text-right space-x-stack-md flex justify-end">
        <FileUpload.Root
          class="border border-border-primary rounded-lg h-36  text-text-secondary flex items-center justify-center"
          onFileChange={({ acceptedFiles: [file] }) => handleFileSelected(file)}
        >
          <Show
            when={customIconPickerModel()?.icon}
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
      </div>
    </Modal>
  );
}
