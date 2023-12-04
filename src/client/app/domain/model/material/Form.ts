import type { NewMaterialEntityDTO } from '@domain/model/material';
import Form from '@domain/model/abstract/Form';

type Material = Pick<NewMaterialEntityDTO, 'icon' | 'name' | 'sourceUrl'>;

export default class FileForm extends Form<Material> {
  file?: { mimeType: string; path?: string; data?: string | ArrayBuffer };
}
