import { watchEffect } from 'vue';
import { useFileDialog } from '@vueuse/core';
import { container } from 'tsyringe';

import MaterialService from 'service/MaterialService';

export function useNewMaterialByFiles() {
  const { files, open, reset } = useFileDialog();

  watchEffect(() => {
    if (files.value) {
      const rawFiles = Array.from(files.value).map(({ path, type }) => {
        if (!path) {
          throw new Error('no path for file');
        }

        return { sourceUrl: `file://${path}`, mimeType: type, isTemp: true };
      });

      const { uploadFiles } = container.resolve(MaterialService);
      uploadFiles(rawFiles);
    }

    reset();
  });

  return open;
}
