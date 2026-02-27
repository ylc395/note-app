import PDFViewer from '#web/infra/PDFViewer';
import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

export default class PDFEditorViewer extends PDFViewer {
  constructor(public readonly editor: PdfEditor) {
    super();
  }
}
