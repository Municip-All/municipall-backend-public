import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportServices {
  getHello(): string {
    return 'Hello World!';
  }

  getNice(): string {
    return 'Nice call men';
  }
}
