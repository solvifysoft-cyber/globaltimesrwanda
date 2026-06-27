import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { generateNewsSlug, extractIdFromSlug } from '../utils/slug.util';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export class CreateNewsDto {
  @IsString()
  titleEN: string;

  @IsString()
  titleRW: string;

  @IsString()
  titleFR: string;

  @IsString()
  excerptEN: string;

  @IsString()
  excerptRW: string;

  @IsString()
  excerptFR: string;

  @IsString()
  contentEN: string;

  @IsString()
  contentRW: string;

  @IsString()
  contentFR: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  videos?: string[];

  @IsOptional()
  imageCaptions?: Record<string, { EN?: string; RW?: string; FR?: string }>;

  @IsString()
  author: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  trending?: boolean;
}

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  titleEN?: string;

  @IsOptional()
  @IsString()
  titleRW?: string;

  @IsOptional()
  @IsString()
  titleFR?: string;

  @IsOptional()
  @IsString()
  excerptEN?: string;

  @IsOptional()
  @IsString()
  excerptRW?: string;

  @IsOptional()
  @IsString()
  excerptFR?: string;

  @IsOptional()
  @IsString()
  contentEN?: string;

  @IsOptional()
  @IsString()
  contentRW?: string;

  @IsOptional()
  @IsString()
  contentFR?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  videos?: string[];

  @IsOptional()
  imageCaptions?: Record<string, { EN?: string; RW?: string; FR?: string }>;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  trending?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  // ---- Create ----------------------------------------------------------------

  async create(createNewsDto: CreateNewsDto) {
    const { images, videos, imageCaptions, ...rest } = createNewsDto as any;

    // Create the record first so we have the auto-generated ID, then immediately
    // update the slug to include that ID (guarantees uniqueness).
    const news = await this.prisma.news.create({
      data: {
        ...rest,
        // Temporary placeholder slug — overwritten right below.
        slug: `pending-${Date.now()}`,
        images: images ?? [],
        videos: videos ?? [],
        imageCaptions: imageCaptions ?? {},
        featured: createNewsDto.featured ?? false,
        trending: createNewsDto.trending ?? false,
        publishedAt: new Date(),
      },
    });

    // Now that we have the real ID, generate the proper slug and persist it.
    const slug = generateNewsSlug(createNewsDto.titleEN, news.id);
    return this.prisma.news.update({
      where: { id: news.id },
      data: { slug },
    });
  }

  // ---- Read (list) -----------------------------------------------------------

  async findAll(filters?: {
    category?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.featured !== undefined) {
      where.featured = filters.featured;
    }

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      this.prisma.news.count({ where }),
    ]);

    return { data, total };
  }

  // ---- Read (single by numeric ID) ------------------------------------------

  async findOne(id: number) {
    const news = await this.prisma.news.findUnique({ where: { id } });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    // Increment view counter
    await this.prisma.news.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return news;
  }

  // ---- Read (single by slug OR numeric ID string) ---------------------------
  //
  // This is the primary lookup used by the public-facing article page and the
  // social-preview endpoint.  It accepts:
  //   - A full slug like "government-announces-policy-42"
  //   - A pure numeric string like "42" (backward compat with old URLs)
  //
  // The slug always ends with "-<id>" so we first try an exact slug match; if
  // that fails we fall back to extracting the trailing ID and querying by that.

  async findBySlug(slug: string) {
    // 1. Try exact slug match (fastest path for new URLs)
    let news = await this.prisma.news.findUnique({ where: { slug } });

    // 2. Fall back: extract ID from slug tail (handles old /news/42 style URLs
    //    and any slug whose DB record was written before slugs were introduced)
    if (!news) {
      const id = extractIdFromSlug(slug);
      if (!isNaN(id)) {
        news = await this.prisma.news.findUnique({ where: { id } });
      }
    }

    if (!news) {
      throw new NotFoundException(`News not found: ${slug}`);
    }

    // Increment view counter
    await this.prisma.news.update({
      where: { id: news.id },
      data: { views: { increment: 1 } },
    });

    return news;
  }

  // ---- Update ----------------------------------------------------------------

  async update(id: number, updateNewsDto: UpdateNewsDto) {
    const news = await this.prisma.news.findUnique({ where: { id } });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    const { images, videos, imageCaptions, ...rest } = updateNewsDto as any;

    // If the English title changed, regenerate the slug so the URL stays fresh.
    const newTitle = updateNewsDto.titleEN;
    const slugUpdate = newTitle ? { slug: generateNewsSlug(newTitle, id) } : {};

    // Prepare the update data
    const updateData: any = {
      ...rest,
      ...slugUpdate,
    };

    // Handle images: if provided, REPLACE the entire array (don't append)
    if (images !== undefined) {
      updateData.images = images;
    }

    // Handle videos: if provided, REPLACE the entire array (don't append)
    if (videos !== undefined) {
      updateData.videos = videos;
    }

    // Handle imageCaptions: if provided, REPLACE the entire object
    if (imageCaptions !== undefined) {
      updateData.imageCaptions = imageCaptions;
    }

    return this.prisma.news.update({
      where: { id },
      data: updateData,
    });
  }

  // ---- Delete ----------------------------------------------------------------

  async remove(id: number) {
    const news = await this.prisma.news.findUnique({ where: { id } });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    return this.prisma.news.delete({ where: { id } });
  }

  // ---- Category helpers ------------------------------------------------------

  async getByCategory(category: string, limit?: number) {
    return this.prisma.news.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getFeatured(limit: number = 3) {
    return this.prisma.news.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTrending(limit: number = 5) {
    return this.prisma.news.findMany({
      where: { trending: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
