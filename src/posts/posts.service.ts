import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { QueryPostsDto } from "./dto/query-posts.dto";
import { PostCategory, PostStatus, Role } from "@prisma/client";

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId,
        tags: JSON.stringify(createPostDto.tags || []),
        publishedAt:
          createPostDto.status === PostStatus.PUBLISHED ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryPostsDto) {
    const {
      category,
      status,
      featured,
      authorId,
      limit = 10,
      page = 1,
      search,
    } = query;

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (featured !== undefined) where.featured = featured;
    if (authorId) where.authorId = authorId;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: {
                where: {
                  status: "APPROVED",
                },
              },
            },
          },
        },
        orderBy: [
          { featured: "desc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts.map((post) => ({
        ...post,
        tags: this.parseTags(post.tags),
        commentsCount: post._count.comments,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                status: "APPROVED",
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // Increment view count
    await this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return {
      ...post,
      tags: this.parseTags(post.tags),
      commentsCount: post._count.comments,
    };
  }

  async update(
  id: string,
  updatePostDto: UpdatePostDto,
  userId: string,
  userRole: Role,
) {
  const post = await this.findOne(id);

  // Check permissions
  if (
    post.authorId !== userId &&
    userRole !== Role.ADMIN &&
    userRole !== Role.EDITOR
  ) {
    throw new ForbiddenException("You can only edit your own posts");
  }

  const updateData: any = {
    ...updatePostDto,
  };

  // Handle tags
  if (updatePostDto.tags) {
    updateData.tags = JSON.stringify(updatePostDto.tags);
  }

  

  try {
    return await this.prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw new BadRequestException('Failed to update post');
  }
}

  async remove(id: string, userId: string, userRole: Role) {
    const post = await this.findOne(id);

    // Check permissions
    if (
      post.authorId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.EDITOR
    ) {
      throw new ForbiddenException("You can only delete your own posts");
    }

    return this.prisma.post.delete({
      where: { id },
    });
  }

  private parseTags(tags: string): string[] {
    try {
      return JSON.parse(tags || "[]");
    } catch {
      return [];
    }
  }
}
