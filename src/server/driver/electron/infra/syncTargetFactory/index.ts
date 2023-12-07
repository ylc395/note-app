import type { SyncTargetFactory } from '@domain/infra/synchronizer.js';

import FsSyncTarget from './FsSyncTarget.js';

const syncTargetFactory: SyncTargetFactory = function (target) {
  switch (target) {
    case 'fs':
      return new FsSyncTarget('');
    default:
      throw new Error('invalid target');
  }
};

export default syncTargetFactory;
