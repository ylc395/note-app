import { FileUpload, type UseFileUploadContext } from '@ark-ui/solid';
import { FileIcon, HardDriveUploadIcon } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import { normalizeTitle } from '#domain/shared/model/note';
import { useContext } from '../../composables';

export default function LocalFileUploader(props: { className?: string }) {
  const editor = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof MarkdownEditor);

    return editor;
  });

  async function handleFileChange(file: File) {
    editor().resourceManager?.setFile(
      {
        mimeType: file.type,
        name: file.name,
        data: await file.arrayBuffer(),
      },
      true,
    );
  }

  function cancel(ctx: UseFileUploadContext) {
    const { resourceManager: fileUploader } = editor();
    assert(fileUploader);

    fileUploader.clearFile();
    ctx().clearFiles();
  }

  return (
    <FileUpload.Root
      class={props.className}
      onFileChange={({ acceptedFiles: [file] }) => file && handleFileChange(file)}
    >
      <Show
        when={editor().resourceManager?.file}
        fallback={
          <FileUpload.Dropzone class="text-sm w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <FileUpload.Trigger class="cursor-pointer flex items-center justify-center flex-col">
              <HardDriveUploadIcon class="size-10 mb-4 stroke-1" />
              <p>上传本地资源</p>
              <p>可拖拽至此</p>
            </FileUpload.Trigger>
          </FileUpload.Dropzone>
        }
      >
        <FileUpload.Context>
          {(ctx) => (
            <>
              <FileUpload.ItemGroup class="text-sm">
                <For each={ctx().acceptedFiles}>
                  {(item) => (
                    <FileUpload.Item file={item}>
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
                      </div>
                    </FileUpload.Item>
                  )}
                </For>
              </FileUpload.ItemGroup>
              <Show when={editor().resourceManager?.duplicatedNotes}>
                {(notes) => (
                  <>
                    <p>
                      该资源已经存在于
                      <a>{normalizeTitle(notes()![0]!)}</a>
                      {notes().length > 1 && `等${notes().length}个笔记`}
                      中。
                    </p>
                    <p>是否仍然创建？</p>
                    <div>
                      <button onClick={() => editor().resourceManager?.upload()}>继续创建</button>
                      <button onClick={() => cancel(ctx)}>取消</button>
                    </div>
                  </>
                )}
              </Show>
            </>
          )}
        </FileUpload.Context>
      </Show>
      <FileUpload.HiddenInput />
    </FileUpload.Root>
  );
}
