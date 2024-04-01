import { action, makeObservable, observable } from 'mobx';

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
  constructor() {
    makeObservable(this);
  }

  @observable public by = SortBy.CreatedAtDesc;

  @action.bound
  public setBy(value: SortBy) {
    this.by = value;
  }

  public sort(entity1: Sortable, entity2: Sortable) {
    return entity1.updatedAt - entity2.updatedAt;
  }
}
