import type { NewMaterialEntityDTO } from '@shared/domain/model/material';
import Form from '@domain/app/model/abstract/Form';

type Material = Pick<NewMaterialEntityDTO, 'icon' | 'title' | 'sourceUrl' | 'parentId'>;

export default class FileForm extends Form<Material> {
  file?: { mimeType: string; path?: string; data?: string | ArrayBuffer };
}
