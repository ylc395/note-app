import { observable } from 'mobx';

export default observable<{
  isMenuVisible: 'alwaysVisible' | 'visible' | 'invisible';
}>({
  isMenuVisible: 'visible',
});
