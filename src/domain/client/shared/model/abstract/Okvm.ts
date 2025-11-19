import singletonContainer from '#utils/singletonContainer';
import PersistableModel from './PersistableModel';
import { token } from '../../infra/kvStorage';

// Object Key-Value Mapping（效仿 ORM、ODM 的自创命名）
export default abstract class Okvm extends PersistableModel {
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
