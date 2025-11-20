import singletonContainer from '#utils/singletonContainer';
import ActiveRecord from './ActiveRecord';
import { token } from '../../infra/kvStorage';

export default abstract class KvActiveRecord extends ActiveRecord {
  protected abstract readonly key: string;

  private readonly db = singletonContainer.resolve(token);

  protected override getValue() {
    return this.db.get(this.key);
  }

  protected save() {
    return this.db.set(this.key, this.toJSON());
  }
}
