import type { MemoVO } from '#domain/shared/model/memo';
import { observable } from 'mobx';

export default observable<{
  isMenuVisible: boolean;
  revisionViewId: MemoVO['id'] | undefined;
}>({
  isMenuVisible: false,
  revisionViewId: undefined,
});
