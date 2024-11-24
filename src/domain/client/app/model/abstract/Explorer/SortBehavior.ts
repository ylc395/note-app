import assert from 'assert';
import { action, observable } from 'mobx';

export enum SortBy {
  TitleAsc = 'titleAsc',
  TitleDesc = 'titleDesc',
  CreatedAtAsc = 'createdAtAsc',
  CreatedAtDesc = 'createdAtDesc',
  UpdatedAtAsc = 'updatedAtAsc',
  UpdatedAtDesc = 'updatedAtDesc',
}

interface Sortable {
  title: string;
  updatedAt: number;
  createdAt: number;
}

export default class SortBehavior {
  @observable public accessor by = SortBy.CreatedAtDesc;

  @action.bound
  public setBy(value: SortBy) {
    this.by = value;
  }

  public readonly sort = (entity1: Sortable, entity2: Sortable) => {
    const FLAG = [SortBy.CreatedAtAsc, SortBy.TitleAsc, SortBy.UpdatedAtAsc].includes(this.by) ? 1 : -1;

    if ([SortBy.TitleAsc, SortBy.TitleDesc].includes(this.by)) {
      return entity1.title > entity2.title ? FLAG : -FLAG;
    }

    if ([SortBy.CreatedAtAsc, SortBy.CreatedAtDesc].includes(this.by)) {
      return entity1.createdAt > entity2.createdAt ? FLAG : -FLAG;
    }

    if ([SortBy.UpdatedAtAsc, SortBy.UpdatedAtDesc].includes(this.by)) {
      return entity1.updatedAt > entity2.updatedAt ? FLAG : -FLAG;
    }

    assert.fail('invalid sort');
  };
}
