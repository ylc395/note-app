import { reaction, when } from 'mobx';
import PDFViewer, { type Options } from '#web/infra/PDFViewer';
import type PdfEditor from '#domain/client/app/model/note/editor/PdfEditor';

export default class PDFEditorViewer {
  constructor(public readonly editor: PdfEditor) {
    this.bindTextFinder();
  }

  private readonly abortController = new AbortController();

  public readonly viewer = new PDFViewer();

  public async init(options: Pick<Options, 'container' | 'view'>) {
    await when(() => this.editor.isReady, { signal: this.abortController.signal });
    return this.viewer.init(this.editor.doc!, options);
  }

  private bindTextFinder() {
    const fields = ['query', 'caseSensitive', 'entireWord'] as const;

    for (const field of fields) {
      // 把 model 上的状态同步到 infra 中
      reaction(
        () => this.editor.textFinder.options[field],
        (value) => this.viewer.textFinder.set(field, value),
        { signal: this.abortController.signal },
      );
    }

    // 把 infra 上的结果同步到 model 中
    reaction(
      () => this.viewer.textFinder.result,
      (result) => result && this.editor.textFinder.updateResult(result),
    );
  }

  public destroy() {
    this.viewer.destroy();
  }
}
