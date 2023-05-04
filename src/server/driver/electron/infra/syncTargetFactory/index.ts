import type { SyncTargetFactory } from 'infra/SyncTargetFactory';
import FsSyncTarget from './FsSyncTarget';

const syncTargetFactory: SyncTargetFactory = function (target) {
  switch (target) {
    case 'fs':
      return new FsSyncTarget('');
    default:
      throw new Error('invalid target');
  }
};

export default syncTargetFactory;
