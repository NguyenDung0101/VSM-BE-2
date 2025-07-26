import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
} from "class-validator";
import { PostCategory, PostStatus } from "@prisma/client";

export class CreatePostDto {
  @ApiProperty({
    example: "10 Bí quyết để hoàn thành Marathon đầu tiên",
    description: "Post title",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      "Những lời khuyên quan trọng nhất cho người mới bắt đầu chạy marathon.",
    description: "Post excerpt",
  })
  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @ApiProperty({
    example: "Full content of the post in Markdown format...",
    description: "Post content in Markdown",
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: "/images/posts/marathon-tips.jpg",
    description: "Post cover image URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({
    enum: PostCategory,
    example: PostCategory.TRAINING,
    description: "Post category",
  })
  @IsEnum(PostCategory)
  category: PostCategory;

  @ApiProperty({
    enum: PostStatus,
    example: PostStatus.PUBLISHED,
    description: "Post status",
    required: false,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    example: true,
    description: "Whether the post is featured",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({
    example: ["marathon", "training", "beginner", "tips"],
    description: "Post tags",
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Add this if you're still sending date from frontend
  @IsOptional()
  @IsString()
  date?: string;
}
