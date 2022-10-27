import { Module } from '@nestjs/common';
import { token as materialRepositoryToken } from 'service/repository/MaterialRepository';
import { token as fileRepositoryToken } from 'service/repository/FileRepository';
import MaterialRepository from 'driver/sqlite/repository/MaterialRepository';
import FileRepository from 'driver/sqlite/repository/FileRepository';

@Module({
  providers: [
    { provide: materialRepositoryToken, useClass: MaterialRepository },
    { provide: fileRepositoryToken, useClass: FileRepository },
  ],
  exports: [materialRepositoryToken, fileRepositoryToken],
})
export default class RepositoryModule {}
