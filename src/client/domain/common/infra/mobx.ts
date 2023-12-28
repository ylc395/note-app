import { configure } from 'mobx';

configure({
  enforceActions: 'always',
  reactionRequiresObservable: true,
  disableErrorBoundaries: true,
});
