import type { MaterialDTO } from 'interface/material';
import Form from 'model/abstract/Form';

export type TextMaterial = Pick<MaterialDTO, 'icon' | 'name' | 'sourceUrl' | 'text'>;

export default class FileForm extends Form<TextMaterial> {}
