import MarkdownEditor from '#web/components/MarkdownEditor';
import { useContext } from '../context';

export default function BodyEditor() {
  const ctx = useContext()!;

  return <MarkdownEditor onUpdate={(md) => ctx.editor.update({ body: md })} />;
}
