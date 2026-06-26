import { FileUpload, type UseFileUploadContext } from '@ark-ui/solid';
import { HardDriveUploadIcon } from 'lucide-solid';
import { createMemo, For, Show } from 'solid-js';
import assert from 'assert';
import { cx } from 'class-variance-authority';

import MarkdownEditor from '#domain/client/app/model/Workbench/noteEditor/MarkdownEditor';
import { normalizeTitle } from '#domain/shared/model/note';
import Button from '#web/view/components/Button';
import Icon from '#web/view/components/Icon.jsx';
import singletonContainer from '#utils/singletonContainer';
import Workbench from '#domain/client/app/model/Workbench';
import { EntityTypes } from '#domain/shared/model/entity';

import { useContext } from '../../composables';
import styles from './uploader.module.css';
export default function LocalFileUploader() {
  const workbench = singletonContainer.resolve(Workbench);
  const editor = createMemo(() => {
    const { editor } = useContext()!;
    assert(editor instanceof MarkdownEditor);

    return editor;
  });

  const firstDuplicatedNote = createMemo(() => editor().resourceManager?.duplicatedNotes?.[0]);
  const duplicatedCount = createMemo(() => editor().resourceManager?.duplicatedNotes?.length ?? 0);

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
      class={styles.container}
      onFileChange={({ acceptedFiles: [file] }) => file && handleFileChange(file)}
    >
      <Show
        when={editor().resourceManager?.file}
        fallback={
          <FileUpload.Dropzone class={cx(styles.trigger, 'data-[dragging]:bg-bg-accent-subtle')}>
            <FileUpload.Trigger class="cursor-pointer flex items-center justify-center flex-col">
              <HardDriveUploadIcon class={styles.triggerIcon} />
              <p class={styles.triggerTitle}>加载本地资源</p>
              <p class={styles.triggerSubtitle}>可拖拽至此</p>
            </FileUpload.Trigger>
          </FileUpload.Dropzone>
        }
      >
        <FileUpload.Context>
          {(ctx) => (
            <div class={styles.content}>
              <FileUpload.ItemGroup class="text-sm flex flex-col items-center">
                <For each={ctx().acceptedFiles}>
                  {(item) => (
                    <FileUpload.Item file={item} class="flex flex-col items-center">
                      <FileUpload.ItemPreview class="mb-3 text-fg-tertiary">
                        <Icon mimeType={item.type} />
                      </FileUpload.ItemPreview>
                      <div class="flex items-center">
                        <FileUpload.ItemName
                          title={item.name}
                          class="max-w-42 whitespace-nowrap overflow-hidden text-ellipsis text-fg-secondary"
                        />
                        <FileUpload.ItemSizeText class="text-fg-tertiary text-xs shrink-0" />
                      </div>
                    </FileUpload.Item>
                  )}
                </For>
              </FileUpload.ItemGroup>
              <Show when={firstDuplicatedNote()}>
                {(note) => (
                  <div class="text-xs text-fg-secondary leading-relaxed">
                    <p class="mb-2">
                      该资源已经存在于
                      <a
                        onClick={() =>
                          workbench.open({
                            entityType: EntityTypes.Note,
                            entityId: note().id,
                            mimeType: note().mimeType,
                          })
                        }
                        class="text-fg-link hover:text-fg-link-hover underline-offset-2 hover:underline cursor-pointer mx-1"
                      >
                        {normalizeTitle(note())}
                      </a>
                      {duplicatedCount() > 1 && `等${duplicatedCount()}个笔记`}中
                    </p>
                    <p class="mt-1">是否仍然创建？</p>
                    <div class={styles.actions}>
                      <Button onClick={() => cancel(ctx)}>取消</Button>
                      <Button onClick={() => editor().resourceManager?.upload()}>继续创建</Button>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          )}
        </FileUpload.Context>
      </Show>
      <FileUpload.HiddenInput />
    </FileUpload.Root>
  );
}
