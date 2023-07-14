import { Controller } from '@nestjs/common';

import { Get } from './decorators';

@Controller()
export default class AppStatusController {
  @Get('/ping')
  async ping(): Promise<void> {
    return;
  }
}
