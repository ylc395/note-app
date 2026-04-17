import { createMemo, For, Show } from 'solid-js';
import { difference } from 'lodash-es';
import assert from 'assert';

import Modal from '#web/view/components/Modal';
import { useContext } from '../context';
import { normalizeTitle } from '#domain/shared/model/note';
import Button from '#web/view/components/Button';
import Icon from '#web/view/components/Icon';

export default function DndDuplicatedModal() {
  const explorer = createMemo(() => useContext()!.treeExplorer);
  const fileUploader = createMemo(() => explorer().fileUploader);

  function handleOverwrite() {
    fileUploader()?.upload();
  }

  function handleSkip() {
    const uploader = fileUploader();
    assert(uploader);

    const uniqueFiles = difference(
      uploader.files,
      uploader.duplicatedFiles.map(({ file }) => file),
    );
    uploader.upload(uniqueFiles);
  }

  function handleCancel() {
    explorer().destroyFileUploader();
  }

  return (
    <Modal
      title="存在重复笔记"
      open={Boolean(fileUploader()?.hasDuplicated)}
      onClose={handleCancel}
      bottom={
        <div class="mt-6 text-right space-x-4 flex justify-end">
          <Button onClick={handleCancel}>取消上传</Button>
          <Show when={(fileUploader()?.duplicatedFiles?.length ?? 0) < (fileUploader()?.files.length ?? 0)}>
            <Button onClick={handleSkip}>跳过重复</Button>
          </Show>
          <Button onClick={handleOverwrite}>全部上传</Button>
        </div>
      }
    >
      <div class="max-h-60 overflow-y-auto space-y-3">
        <p class="text-sm text-fg-secondary">
          即将创建 {fileUploader()?.files.length} 个笔记。但以下{fileUploader()?.duplicatedFiles.length}个笔记已经存在：
        </p>
        <For each={fileUploader()?.duplicatedFiles}>
          {({ file, notes }) => (
            <div class="border border-border-secondary rounded-lg p-3">
              <div class="flex items-center gap-2 text-sm font-medium text-fg-primary mb-1.5">
                <Icon className="size-4" mimeType={file.mimeType} />
                <span class="truncate">{file.name}</span>
              </div>
              <div class="pl-6 space-y-1">
                <For each={notes}>
                  {(note) => <div class="text-xs text-fg-tertiary truncate">已存在：{normalizeTitle(note)}</div>}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </Modal>
  );
}
