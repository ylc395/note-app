import { watchEffect } from 'vue';
import { useFileDialog, useConfirmDialog } from '@vueuse/core';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export function useNewMaterialByFiles() {
  const { files, open, reset } = useFileDialog();
  const dialog = useConfirmDialog();

  watchEffect(() => {
    if (files.value) {
      const rawFiles = Array.from(files.value).map(({ path, type }) => {
        if (!path) {
          throw new Error('no path for file');
        }

        return { sourceUrl: `file://${path}`, mimeType: type, isTemp: true };
      });

      const { generateNewMaterialsByFiles } = container.resolve(MaterialService);
      generateNewMaterialsByFiles(rawFiles);
      dialog.reveal();
    }

    reset();
  });

  return { open, dialog };
}
