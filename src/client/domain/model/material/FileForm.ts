import type { MaterialDTO } from 'interface/material';
import Form from 'model/abstract/Form';

export type FileMaterial = Pick<MaterialDTO, 'icon' | 'name' | 'sourceUrl' | 'file'>;

export default class FileForm extends Form<FileMaterial> {}
