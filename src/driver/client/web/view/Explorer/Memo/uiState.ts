import { observable } from 'mobx';

export default observable<{
  tabVisibility: 'alwaysVisible' | 'visible' | 'invisible';
  selectorVisibility: 'always' | 'visible';
}>({
  tabVisibility: 'visible',
  selectorVisibility: 'visible',
});
