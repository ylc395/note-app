import { For, Show } from 'solid-js';
import { FileUpload } from '@ark-ui/solid';
import { FileIcon, FilePlusIcon, XIcon } from 'lucide-solid';

import Modal from '#web/view/components/Modal';
import type CustomIconPicker from '#domain/client/app/model/note/IconManager/CustomIconPicker';

export default function CustomIconPickerView(props: { iconPicker: CustomIconPicker; onFinish?: () => void }) {
  async function handleFileSelected(file?: File) {
    props.iconPicker.set(file && { mimeType: file.type, data: await file.arrayBuffer() });
  }

  function submit() {
    props.iconPicker.submit();
    props.onFinish?.();
  }

  function close() {
    props.iconPicker.destroy();
  }

  return (
    <Modal
      title="新建图标"
      open
      confirmText="创建并使用"
      canConfirm={!props.iconPicker.canSubmit}
      onConfirm={submit}
      onCancel={close}
      onClose={close}
    >
      <div class="mt-6 text-right space-x-4 flex justify-end">
        <FileUpload.Root
          class="border border-border-primary rounded-lg h-36  text-fg-secondary flex items-center justify-center"
          onFileChange={({ acceptedFiles: [file] }) => handleFileSelected(file)}
        >
          <Show
            when={props.iconPicker.icon}
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
