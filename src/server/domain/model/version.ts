export * from '@shared/domain/model/version.js';

import type { VersionMergeRequest } from '@shared/domain/model/version.js';

export type IndexRange = Pick<VersionMergeRequest, 'startIndex' | 'endIndex'>;
