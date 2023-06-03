import { runInAction } from 'mobx';
// import sanitizeHtml from 'sanitize-html';

import type { EntityMaterialVO, AnnotationVO } from 'interface/material';
import type Tile from 'model/workbench/Tile';
import Editor from './Editor';

interface WebPage {
  metadata: EntityMaterialVO;
  html: string;
}

export default class HtmlEditor extends Editor<WebPage> {
  constructor(tile: Tile, materialId: EntityMaterialVO['id']) {
    super(tile, materialId);
  }

  doc?: unknown;

  protected async init() {
    const [{ body: metadata }, { body: html }] = await Promise.all([
      this.remote.get<void, EntityMaterialVO>(`/materials/${this.entityId}`),
      this.remote.get<void, string>(`/materials/${this.entityId}/blob`),
    ]);

    this.load({ metadata, html: HtmlEditor.filterHtml(html) });

    const { body: annotations } = await this.remote.get<unknown, AnnotationVO[]>(
      `/materials/${this.entityId}/annotations`,
    );

    runInAction(() => {
      this.annotations.push(...annotations);
    });
  }

  private static filterHtml(html: string) {
    return html;
    //   return sanitizeHtml(html, {
    //     allowedTags: [],
    //     allowedAttributes: {},
    //     parseStyleAttributes: false,
    //   });
  }
}
