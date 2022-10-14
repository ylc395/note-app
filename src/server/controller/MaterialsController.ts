import { Controller } from '@nestjs/common';
import { Post } from './decorators';

@Controller()
export default class MaterialsController {
  @Post('materials')
  create(data: any) {
    return 'hello!';
  }
}
