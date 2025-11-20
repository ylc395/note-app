import singletonContainer from '#utils/singletonContainer';
import ActiveRecord from './ActiveRecord';
import { token } from '../../infra/documentDb';

export default abstract class DocumentActiveRecord extends ActiveRecord {
  constructor(private readonly storeName: string, private readonly id: unknown) {
    super();
  }

  private readonly db = singletonContainer.resolve(token);

  protected override toJSON() {
    return { id: this.id, ...super.toJSON() };
  }

  protected override getValue() {
    return this.db.getByKey(this.storeName, this.id);
  }

  public save() {
    return this.db.put(this.storeName, this.toJSON());
  }
}
