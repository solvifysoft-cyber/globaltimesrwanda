import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsRelatedController } from './news-related.controller';
import { NewsService } from './news.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NewsController, NewsRelatedController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}

