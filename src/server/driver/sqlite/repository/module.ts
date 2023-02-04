import { Module, Global } from '@nestjs/common';
import { token as noteRepositoryToken } from 'service/repository/NoteRepository';
import { token as recyclableRepositoryToken } from 'service/repository/RecyclableRepository';

import NoteRepository from './NoteRepository';
import RecyclableRepository from './RecyclableRepository';

const repositories = [
  [noteRepositoryToken, NoteRepository],
  [recyclableRepositoryToken, RecyclableRepository],
] as const;

@Global()
@Module({
  providers: repositories.map(([token, repositoryClass]) => ({ provide: token, useClass: repositoryClass })),
  exports: repositories.map(([token]) => token),
})
export default class RepositoryModule {}
