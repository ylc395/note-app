import { action, observable, when } from 'mobx';
import type Editor from '#web/view/components/MarkdownEditor/Editor';

/**
 * 大纲相关的逻辑：根据编辑器滚动位置追踪当前所在的标题、以及点击大纲项时滚动到对应标题。
 *
 * 这部分逻辑依赖编辑器实例的 prosemirror view 与根 DOM，因此以编辑器实例为构造参数。
 * 滚动监听在构造时注册、在 destroy 时移除，生命周期与大纲面板一致。
 */
export default class Outline {
  @observable.ref public accessor currentHeadingPosition: number[] | undefined;

  private readonly abortController = new AbortController();

  constructor(private readonly editor: Editor) {
    this.editor.containerEl.addEventListener('scrollend', this.updateCurrent, { signal: this.abortController.signal });

    when(() => this.editor.isReady, this.updateCurrent, { signal: this.abortController.signal });
  }

  /**
   * 遍历文档中的所有 heading 节点，通过 TOC 层级栈计算每个 heading 的 position
   */
  private forEachHeading(fn: (headingPosition: number[], pos: number) => boolean | void) {
    const doc = this.editor.editorView.state.doc;

    const stack = [{ depth: 0, position: [] as number[], childrenCount: 0 }];
    let stop = false;

    doc.descendants((node, pos) => {
      if (stop) return false;
      if (node.type.name !== 'heading') return;

      const depth = node.attrs.level as number;

      // 弹出所有深度 >= 当前深度的栈帧，找到合适的父标题
      while (stack.length > 0 && stack.at(-1)!.depth >= depth) {
        stack.pop();
      }

      const parent = stack.at(-1)!;
      const headingPosition = [...parent.position, parent.childrenCount];
      parent.childrenCount++;

      stack.push({ depth, position: headingPosition, childrenCount: 0 });

      if (fn(headingPosition, pos) === false) {
        stop = true;
        return false;
      }
    });
  }

  public scrollIntoHeading(position: number[]) {
    if (!this.editor.isReady) return;

    let targetPos: number | null = null;

    this.forEachHeading((headingPosition, pos) => {
      if (headingPosition.length === position.length && headingPosition.every((v, i) => v === position[i])) {
        targetPos = pos;
        return false;
      }
    });

    if (targetPos !== null) {
      const dom = this.editor.editorView.nodeDOM(targetPos);
      if (dom instanceof HTMLElement) {
        dom.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  private readonly updateCurrent = action(() => {
    if (!this.editor.isReady) return undefined;

    const editorView = this.editor.editorView;
    const containerRect = this.editor.containerEl.getBoundingClientRect();
    let currentPosition: number[] | undefined;

    this.forEachHeading((headingPosition, pos) => {
      if (currentPosition) {
        return false;
      }

      const dom = editorView.nodeDOM(pos);

      if (dom instanceof HTMLElement) {
        if (dom.getBoundingClientRect().bottom > containerRect.top) {
          currentPosition = headingPosition;
        }
      }
    });

    this.currentHeadingPosition = currentPosition;
  });

  public destroy() {
    this.abortController.abort();
  }
}
