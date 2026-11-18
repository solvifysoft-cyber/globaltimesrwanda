import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { NewsService } from './news.service';

/**
 * GET /news-related/:id?category=Sports&limit=4
 *
 * Separate endpoint for related articles that avoids the Nginx
 * `/news/*` proxy rule which would intercept `/news/:id/related`
 * and serve index.html instead of the JSON API response.
 */
@Controller('news-related')
export class NewsRelatedController {
  constructor(private readonly newsService: NewsService) {}

  @Get(':id')
  getRelated(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.getRelated(id, category, limit ? parseInt(limit) : 4);
  }
}
