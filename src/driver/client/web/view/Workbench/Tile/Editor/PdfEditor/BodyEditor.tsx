import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';
import MarkdownEditor from '#web/components/MarkdownEditor';

export default function BodyEditor(props: { editor: PdfEditor }) {
  return <MarkdownEditor onUpdate={(md) => props.editor.update({ body: md })} />;
}
