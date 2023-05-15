import { container } from 'tsyringe';

import { token as remoteToken } from 'infra/remote';
import type { EntityMaterialVO } from 'interface/material';
import type Tile from 'model/workbench/Tile';
import ImageEditor from 'model/material/ImageEditor';
import PdfEditor from 'model/material/PdfEditor';

function load(materialId: EntityMaterialVO['id']) {
  const remote = container.resolve(remoteToken);

  return Promise.all([
    remote.get<void, EntityMaterialVO>(`/materials/${materialId}`),
    remote.get<void, ArrayBuffer>(`/materials/${materialId}/blob`),
  ]).then(([{ body: metadata }, { body: blob }]) => ({ metadata, blob }));
}

export default function materialEditorFactory(tile: Tile, materialId: EntityMaterialVO['id'], mimeType: string) {
  let editor: ImageEditor | PdfEditor | null = null;

  if (mimeType.startsWith('image')) {
    editor = new ImageEditor(tile, materialId);
  } else if (mimeType === 'application/pdf') {
    editor = new PdfEditor(tile, materialId);
  }

  if (!editor) {
    throw new Error('can not create editor');
  }

  load(materialId).then(editor.load);

  return editor;
}
