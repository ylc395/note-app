import z from 'zod';
import { observable } from 'mobx';
import KvActiveRecord from '#domain/client/shared/model/abstract/KvActiveRecord';

export enum SortBy {
  TitleAsc = 'titleAsc',
  TitleDesc = 'titleDesc',
  UpdatedAtAsc = 'updatedAtAsc',
  UpdatedAtDesc = 'updatedAtDesc',
  CreatedAtAsc = 'createdAtAsc',
  CreatedAtDesc = 'createdAtDesc',
}

export enum IconDisplayMode {
  All = 'all',
  None = 'none',
  Custom = 'custom',
}

export default class Setting extends KvActiveRecord {
  protected readonly key = 'note-explorer-setting';

  @observable
  @KvActiveRecord.bidi(z.enum(SortBy))
  public accessor sortBy = SortBy.TitleAsc;

  @observable
  @KvActiveRecord.bidi(z.enum(IconDisplayMode))
  public accessor iconDisplayMode = IconDisplayMode.All;
}
