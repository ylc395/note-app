import singletonContainer from '#utils/singletonContainer';
import PersistableModel from './PersistableModel';
import { token } from '../../infra/documentDb';

// 基于文档型数据库的 ODM （Object-Document Mapping）
export default abstract class Odm extends PersistableModel {
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
