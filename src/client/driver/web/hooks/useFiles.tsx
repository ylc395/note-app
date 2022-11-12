import { useState, type MouseEvent } from 'react';

export default () => {
  const [files, setFiles] = useState<File[]>([]);
  const onChange = async (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files?.length) {
      return;
    }
    setFiles(Array.from(files));
  };

  const select = (e: MouseEvent) => {
    const inputEl = document.createElement('input');

    inputEl.multiple = true;
    inputEl.type = 'file';
    inputEl.style.display = 'none';
    inputEl.onchange = onChange;

    document.body.appendChild(inputEl);
    inputEl.click();

    (e.currentTarget as HTMLElement).onblur = () => inputEl.remove();
  };

  return { select, files };
};
