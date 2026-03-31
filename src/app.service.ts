import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  HelloWorld(): string {
    return 'Hello emna';
  }
}
