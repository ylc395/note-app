export default function selectFile() {
  return new Promise<FileList | null>((resolve) => {
    const inputEl = document.createElement('input');
    inputEl.type = 'file';
    inputEl.style.display = 'none';
    document.body.appendChild(inputEl);

    const dispose = () => {
      inputEl.remove();
    };

    inputEl.click();
    inputEl.addEventListener('change', () => {
      resolve(inputEl.files);
      dispose();
    });
    inputEl.addEventListener('blur', () => {
      resolve(null);
      dispose();
    });
  });
}
