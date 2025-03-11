import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

export default function PdfEditorView(props: { editor: PdfEditor }) {
  return <div>{props.editor.id}</div>;
}
