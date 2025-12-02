import { FileUpload, type UseFileUploadContext } from '@ark-ui/solid';
import { FileIcon, FilePlusIcon } from 'lucide-solid';
import { For, Show } from 'solid-js';
import assert from 'assert';

import MarkdownEditor from '#domain/client/app/model/note/editor/MarkdownEditor';
import { normalizeTitle } from '#domain/shared/model/note';
import { useContext } from '../../context';

export default function LocalFileUploader(props: { className?: string }) {
  const { editor } = useContext()!;
  assert(editor instanceof MarkdownEditor);

  async function handleFileChange(file: File) {
    assert(editor instanceof MarkdownEditor);
    editor.initFileUploader({
      mimeType: file.type,
      name: file.name,
      data: await file.arrayBuffer(),
    });
  }

  function handleCancel(ctx: UseFileUploadContext) {
    assert(editor instanceof MarkdownEditor);
    editor.resetUploader();
    ctx().clearFiles();
  }

  return (
    <FileUpload.Root
      class={props.className}
      onFileChange={({ acceptedFiles: [file] }) => file && handleFileChange(file)}
    >
      <Show
        when={editor.localUploader}
        fallback={
          <FileUpload.Dropzone class="text-sm w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <FileUpload.Trigger class="flex items-center justify-center flex-col">
              <FilePlusIcon class="w-10 h-10 mb-stack-s stroke-1" />
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
                      </div>
                    </FileUpload.Item>
                  )}
                </For>
              </FileUpload.ItemGroup>
              <Show when={editor.localUploader?.duplicatedNotes}>
                <p>
                  该资源已经存在于<a>{normalizeTitle(editor.localUploader!.duplicatedNotes![0]!)}</a>
                  {editor.localUploader!.duplicatedNotes!.length > 1 &&
                    `等${editor.localUploader!.duplicatedNotes!.length}个笔记`}
                  中。
                </p>
                <p>是否仍然创建？</p>
                <div>
                  <button onClick={editor.localUploader!.upload}>继续创建</button>
                  <button onClick={() => handleCancel(ctx)}>取消</button>
                </div>
              </Show>
            </>
          )}
        </FileUpload.Context>
      </Show>
      <FileUpload.HiddenInput />
    </FileUpload.Root>
  );
}
