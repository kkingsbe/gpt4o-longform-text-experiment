import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GenerateController } from './generate/generate.controller';

@Module({
  imports: [],
  controllers: [AppController, GenerateController],
  providers: [AppService],
})
export class AppModule {}
