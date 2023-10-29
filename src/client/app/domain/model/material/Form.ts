import type { NewMaterialEntityDTO } from 'model/material';
import Form from 'model/abstract/Form';

type Material = Pick<NewMaterialEntityDTO, 'icon' | 'name' | 'sourceUrl'>;

export default class FileForm extends Form<Material> {
  file?: { mimeType: string; path?: string; data?: string | ArrayBuffer };
}
