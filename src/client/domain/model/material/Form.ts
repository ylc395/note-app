import type { MaterialDTO } from 'model/material';
import Form from 'model/abstract/Form';
import type { FilesDTO } from 'model/file';

type Material = Pick<MaterialDTO, 'icon' | 'name' | 'sourceUrl'>;

export default class FileForm extends Form<Material> {
  files?: FilesDTO;
}
