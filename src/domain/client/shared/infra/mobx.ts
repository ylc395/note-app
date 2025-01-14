import { configure } from 'mobx';

configure({
  enforceActions: 'always',
  computedRequiresReaction: true,
  disableErrorBoundaries: true,
});
