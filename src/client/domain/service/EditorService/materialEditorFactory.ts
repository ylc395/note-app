import { container } from 'tsyringe';
import { action, runInAction } from 'mobx';

import { token as remoteToken } from 'infra/remote';
import type { EntityMaterialVO, HighlightDTO, HighlightVO, MaterialVO } from 'interface/material';
import type Tile from 'model/workbench/Tile';
import ImageEditor from 'model/material/ImageEditor';
import PdfEditor, { Events as PdfEditorEvents } from 'model/material/PdfEditor';

function load(materialId: EntityMaterialVO['id']) {
  const remote = container.resolve(remoteToken);

  return Promise.all([
    remote.get<void, EntityMaterialVO>(`/materials/${materialId}`),
    remote.get<void, ArrayBuffer>(`/materials/${materialId}/blob`),
  ]).then(([{ body: metadata }, { body: blob }]) => ({ metadata, blob }));
}

async function loadHighlight(materialId: EntityMaterialVO['id']) {
  const remote = container.resolve(remoteToken);
  const { body: highlights } = await remote.get<unknown, HighlightVO[]>(`/materials/${materialId}/highlights`);

  return highlights;
}

function createPdfEditor(tile: Tile, materialId: MaterialVO['id']) {
  const editor = new PdfEditor(tile, materialId);

  editor.on(PdfEditorEvents.HighlightCreated, async (highlight) => {
    const remote = container.resolve(remoteToken);
    const { body: createdHighlight } = await remote.post<HighlightDTO, HighlightVO>(
      `/materials/${materialId}/highlights`,
      highlight,
    );

    runInAction(() => {
      editor.highlights.push(createdHighlight);
    });
  });

  loadHighlight(materialId).then(action((highlights) => editor.highlights.push(...highlights)));

  return editor;
}

export default function materialEditorFactory(tile: Tile, materialId: EntityMaterialVO['id'], mimeType: string) {
  let editor: ImageEditor | PdfEditor | null = null;

  if (mimeType.startsWith('image')) {
    editor = new ImageEditor(tile, materialId);
  } else if (mimeType === 'application/pdf') {
    editor = createPdfEditor(tile, materialId);
  }

  if (!editor) {
    throw new Error('can not create editor');
  }

  load(materialId).then(editor.load);

  return editor;
}
