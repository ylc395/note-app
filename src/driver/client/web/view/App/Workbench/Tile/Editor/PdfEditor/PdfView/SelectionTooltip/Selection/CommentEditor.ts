import { observable, computed, action } from 'mobx';
import Mark from 'mark.js';
import assert from 'assert';
import { range, zip } from 'lodash-es';

import {
  default as AnnotationManager,
  type Position,
} from '#domain/client/app/model/note/editor/PdfEditor/AnnotationManager';
import type PDFEditorViewer from '../../../PDFEditorViewer';

export default class CommentEditor {
  public content = '';

  @observable.ref private accessor _markers: Mark[] | undefined;

  private position?: Position;

  private static readonly TEMP_MARK_CLASS_NAME = 'temp-comment-editor-mark';

  constructor(private readonly pdfViewer: PDFEditorViewer) {}

  public get markers() {
    return this._markers;
  }

  @computed public get isOpen() {
    return this._markers !== undefined;
  }

  @action
  public start(position?: Position) {
    position = position || this.position;
    assert(position);

    const pageRange = range(position.startPage, position.endPage + 1);
    const currentRanges = pageRange.map((page) => AnnotationManager.positionToRange(position, page));

    const markers = pageRange.map((page) => {
      const { textLayer } = this.pdfViewer.viewer.getPageInfo(page);
      assert(textLayer);
      return new Mark(textLayer);
    });

    for (const [marker, range] of zip(markers, currentRanges)) {
      marker!.markRanges([range!], {
        className: `text-transparent opacity-40 ${CommentEditor.TEMP_MARK_CLASS_NAME}`,
        each: (el) => {
          (el as HTMLElement).style.backgroundColor = this.pdfViewer.editor.newAnnotationColor;
        },
      });
    }

    this._markers = markers;
    this.position = position;
  }

  @action
  public cancel() {
    assert(this._markers && this.position);

    this._markers.forEach((marker) => marker.unmark({ className: CommentEditor.TEMP_MARK_CLASS_NAME }));
    this._markers = undefined;
    this.content = '';

    // 恢复原始文本选区
    const currentRange = this.positionToRange(this.position);
    const s = window.getSelection();
    if (s) {
      // 注意：这两行将立刻分别触发 handleSelection
      s.removeAllRanges();
      s.addRange(currentRange);
    }
  }

  @action
  public clearMarks() {
    assert(this._markers);

    this._markers.forEach((marker) => marker.unmark({ className: CommentEditor.TEMP_MARK_CLASS_NAME }));
    this._markers = undefined;
  }

  public setContent(value: string) {
    assert(this.isOpen);
    this.content = value;
  }

  public clearMarkers() {
    this._markers = undefined;
    this.position = undefined;
  }

  private positionToRange(position: Position) {
    const range = new Range();
    const setBoundary = (page: number, totalOffset: number, isStart?: boolean) => {
      const { textLayer } = this.pdfViewer.viewer.getPageInfo(page);
      assert(textLayer);

      const treeWalker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
      let offset = 0;

      let currentNode = treeWalker.nextNode() as Text | null;

      while (currentNode) {
        if (currentNode.length + offset >= totalOffset) {
          range[isStart ? 'setStart' : 'setEnd'](currentNode, totalOffset - offset);
          break;
        } else {
          offset += currentNode.length;
          currentNode = treeWalker.nextNode() as Text | null;
        }
      }
    };

    setBoundary(position.startPage, position.startOffset, true);
    setBoundary(position.endPage, position.endOffset);

    return range;
  }
}
