import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
  IsInt,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PostCategory, PostStatus } from "@prisma/client";

export class QueryPostsDto {
  @ApiProperty({
    enum: PostCategory,
    description: "Filter by post category",
    required: false,
  })
  @IsOptional()
  @IsEnum(PostCategory)
  category?: PostCategory;

  @ApiProperty({
    enum: PostStatus,
    description: "Filter by post status",
    required: false,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiProperty({
    description: "Filter by featured posts",
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({
    description: "Filter by author ID",
    required: false,
  })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiProperty({
    description: "Search in title, excerpt, and content",
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: "Number of posts per page",
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: "Page number",
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
