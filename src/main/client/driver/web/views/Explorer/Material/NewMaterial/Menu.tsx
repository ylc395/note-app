import { observer } from 'mobx-react-lite';

export enum FormTypes {
  File,
  Text,
}

export default observer(function NewMaterial({ onSelect }: { onSelect: (type: FormTypes) => void }) {
  return (
    <ul className="mr-2 list-none p-0">
      <li onClick={() => onSelect(FormTypes.File)}>选择文件</li>
      <li onClick={() => onSelect(FormTypes.Text)}>编辑文本</li>
    </ul>
  );
});
