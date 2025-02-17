import type { MemoVO } from '#domain/shared/model/memo';
import { observable } from 'mobx';

export default observable<{
  sidebarVisibility: 'always' | 'visible' | 'hidden';
  focusMemoId: MemoVO['id'] | undefined;
}>({
  sidebarVisibility: 'visible',
  focusMemoId: undefined,
});
