import type { MaterialDTO } from 'interface/material';
import Form from 'model/abstract/Form';

export type TextMaterial = { text: string } & Pick<MaterialDTO, 'icon' | 'name' | 'sourceUrl'>;

export default class FileForm extends Form<TextMaterial> {}
