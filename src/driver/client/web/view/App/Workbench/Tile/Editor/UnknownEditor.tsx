import { useContext } from './composables';

export default function UnknownEditor() {
  const { editor } = useContext()!;

  return <div>暂不支持类型为 {editor.mimeType} 的资料</div>;
}
