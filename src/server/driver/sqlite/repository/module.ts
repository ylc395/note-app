import { Module, Global } from '@nestjs/common';
import { token as materialRepositoryToken } from 'service/repository/MaterialRepository';
import { token as fileRepositoryToken } from 'service/repository/FileRepository';

import MaterialRepository from './MaterialRepository';
import FileRepository from './FileRepository';

@Global()
@Module({
  providers: [
    { provide: materialRepositoryToken, useClass: MaterialRepository },
    { provide: fileRepositoryToken, useClass: FileRepository },
  ],
  exports: [materialRepositoryToken, fileRepositoryToken],
})
export default class RepositoryModule {}
