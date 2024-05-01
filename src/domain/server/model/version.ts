import type { VersionMergeRequest } from '@domain/shared/model/version.js';

export type IndexRange = Pick<VersionMergeRequest, 'startIndex' | 'endIndex'>;

export * from '@domain/shared/model/version.js';
