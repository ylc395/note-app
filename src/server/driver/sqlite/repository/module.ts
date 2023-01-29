import { Module, Global } from '@nestjs/common';
import { token as noteRepositoryToken } from 'service/repository/NoteRepository';

import NoteRepository from './NoteRepository';

const repositories = [[noteRepositoryToken, NoteRepository]] as const;

@Global()
@Module({
  providers: repositories.map(([token, repositoryClass]) => ({ provide: token, useClass: repositoryClass })),
  exports: repositories.map(([token]) => token),
})
export default class RepositoryModule {}
