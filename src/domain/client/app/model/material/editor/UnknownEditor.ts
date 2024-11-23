import MaterialEditor from './MaterialEditor';

export default class UnknownEditor extends MaterialEditor<never> {
  protected sortAnnotations() {
    return 0;
  }
}
