import { PATH_METADATA } from '@nestjs/common/constants';
import { MessagePattern } from '@nestjs/microservices';

// https://expressjs.com/en/api.html#req
export interface IpcRequest {
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
}

export function Post(path?: string) {
  return function (cls: any, properKey: string, descriptor: PropertyDescriptor) {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, cls);
    console.log(controllerPath);

    // if (!controllerPath) {
    //   throw new Error('Controller has no prefix.');
    // }
    const messagePattern = MessagePattern(`POST /${controllerPath}/${path}`);
    messagePattern(cls, properKey, descriptor);
  };
}
