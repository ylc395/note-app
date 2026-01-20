import MarkdownEditor from '#web/components/MarkdownEditor';
import { useContext } from '../context';

export default function BodyEditor() {
  const ctx = useContext()!;

  function onUpdated(md: string) {
    if (ctx.editor.isCurrent) {
      ctx.editor.update({ body: md });
    }
  }

  return <MarkdownEditor onUpdate={onUpdated} />;
}
