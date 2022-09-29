type ElectronFile = File & { path?: string };

export const selectFiles = async () => {
  const inputEl = document.createElement('input');
  inputEl.type = 'file';
  inputEl.multiple = true;

  document.body.appendChild(inputEl);

  return new Promise<ElectronFile[]>((resolve) => {
    const _resolve = () => {
      resolve(Array.from(inputEl.files || []));
      inputEl.value = '';
      inputEl.removeEventListener('change', _resolve);
      inputEl.remove();
    };
    inputEl.addEventListener('change', _resolve);
    inputEl.click();
  });
};
