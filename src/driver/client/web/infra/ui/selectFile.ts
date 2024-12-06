import type { SelectFileConfig } from '#domain/client/shared/infra/ui';

export default function selectFile(config?: SelectFileConfig) {
  return new Promise<FileList | null>((resolve) => {
    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.style.display = 'none';

    if (config?.multiple) {
      inputEl.multiple = true;
    }

    if (config?.accept) {
      inputEl.accept = config.accept;
    }

    inputEl.addEventListener('change', () => {
      resolve(inputEl.files);
      inputEl.remove();
    });
    inputEl.addEventListener('blur', () => {
      resolve(null);
      inputEl.remove();
    });

    document.body.appendChild(inputEl);
    inputEl.click();
  });
}
