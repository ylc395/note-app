import type { MemoVO } from '#domain/shared/model/memo';
import { observable } from 'mobx';

export default observable<{
  tabVisibility: 'alwaysVisible' | 'visible' | 'invisible';
  selectorVisibility: 'always' | 'visible';
  focusMemoId: MemoVO['id'] | undefined;
}>({
  tabVisibility: 'visible',
  selectorVisibility: 'visible',
  focusMemoId: undefined,
});
