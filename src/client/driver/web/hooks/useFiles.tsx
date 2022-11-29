import { useState } from 'react';

export type Action = 'dir' | 'files';

export default () => {
  const [files, setFiles] = useState<File[]>([]);
  const onChange = async (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files?.length) {
      return;
    }
    setFiles(Array.from(files));
  };

  const select = (action: Action) => {
    if (action === 'dir') {
      return;
    }

    const inputEl = document.createElement('input');

    inputEl.multiple = true;
    inputEl.type = 'file';
    inputEl.style.display = 'none';
    inputEl.onchange = onChange;
    inputEl.onblur = () => inputEl.remove();
    document.body.appendChild(inputEl);
    inputEl.click();
  };

  return { select, files };
};
