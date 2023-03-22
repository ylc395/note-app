import { editorViewCtx } from '@milkdown/core';
import type { Ctx } from '@milkdown/ctx';
import { linkSchema, textSchema } from '@milkdown/preset-commonmark';
import { observable, reaction, action, makeObservable, runInAction } from 'mobx';

const iconLinkMarkType = linkSchema.type();
const textNodeType = textSchema.type();

export default class IconManager {
  constructor(private readonly ctx: Ctx) {
    makeObservable(this);
  }

  getAllLinks() {
    const view = this.ctx.get(editorViewCtx);
    const links: string[] = [];

    view.state.doc.descendants((node) => {
      if (node.type !== textNodeType || !node.text) {
        return;
      }

      for (const mark of node.marks) {
        if (mark.type !== iconLinkMarkType) {
          continue;
        }

        links.push(mark.attrs.href);
      }
    });

    return links;
  }
}
