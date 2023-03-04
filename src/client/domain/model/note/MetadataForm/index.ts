import Form from 'model/abstract/Form';
import type { NoteMetadata as Values } from './type';

export default class NoteMetadataForm extends Form<Values> {}

export const MULTIPLE_ICON_FLAG = Symbol();

export type { NoteMetadata } from './type';
