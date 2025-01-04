import { configure } from 'mobx';

configure({
  enforceActions: 'always',
  reactionRequiresObservable: true,
  computedRequiresReaction: true,
  disableErrorBoundaries: true,
});
