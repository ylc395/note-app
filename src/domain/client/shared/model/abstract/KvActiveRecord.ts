import singletonContainer from '#utils/singletonContainer';
import ActiveRecord from './ActiveRecord';
import { token } from '../../infra/kvStorage';

export default abstract class KvActiveRecord extends ActiveRecord {
  constructor(private readonly key: string) {
    super();
  }

  private readonly db = singletonContainer.resolve(token);

  protected override getValue() {
    return this.db.get(this.key);
  }

  public save() {
    return this.db.set(this.key, this.toJSON());
  }
}
