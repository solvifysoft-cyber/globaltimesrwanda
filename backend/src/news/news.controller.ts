import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NewsService, CreateNewsDto, UpdateNewsDto } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // ---- Write endpoints (protected) ------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.create(createNewsDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewsDto: UpdateNewsDto,
  ) {
    return this.newsService.update(id, updateNewsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.remove(id);
  }

  // ---- Read endpoints (public) -----------------------------------------------
  //
  // ORDER MATTERS: NestJS matches routes top-to-bottom.
  // Named routes ("trending", "featured", "category/:category", "slug/:slug")
  // must come BEFORE the generic ":id" wildcard.

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.newsService.findAll({
      category,
      featured:
        featured === 'true' ? true : featured === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('trending')
  getTrending(@Query('limit') limit?: string) {
    return this.newsService.getTrending(limit ? parseInt(limit) : 5);
  }

  @Get('featured')
  getFeatured(@Query('limit') limit?: string) {
    return this.newsService.getFeatured(limit ? parseInt(limit) : 3);
  }

  @Get('category/:category')
  getByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.getByCategory(
      category,
      limit ? parseInt(limit) : undefined,
    );
  }

  /**
   * GET /news/slug/:slug
   *
   * Resolves an article by its SEO slug (e.g. "government-announces-policy-42")
   * OR by a plain numeric ID string for backward compatibility.
   * This is the endpoint the frontend article page and social preview use.
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.newsService.findBySlug(slug);
  }

  /**
   * GET /news/:id  — kept for backward compatibility with any existing
   * integrations that query by numeric ID directly.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  /**
   * GET /news/:id/related?category=Sports&limit=4
   * Returns articles in the same category, excluding the current one.
   * NOTE: This route is defined AFTER :id but NestJS resolves :id/related
   * correctly as a two-segment pattern distinct from bare :id.
   */
  @Get(':id/related')
  getRelated(
    @Param('id', ParseIntPipe) id: number,
    @Query('category') category: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.getRelated(id, category, limit ? parseInt(limit) : 4);
  }}
