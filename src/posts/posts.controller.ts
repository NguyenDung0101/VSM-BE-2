import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { QueryPostsDto } from "./dto/query-posts.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new post" })
  @ApiResponse({ status: 201, description: "Post created successfully" })
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create(createPostDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: "Get all posts with optional filtering" })
  @ApiResponse({ status: 200, description: "Posts retrieved successfully" })
  findAll(@Query() query: QueryPostsDto) {
    return this.postsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get post by ID" })
  @ApiResponse({ status: 200, description: "Post retrieved successfully" })
  @ApiResponse({ status: 404, description: "Post not found" })
  findOne(@Param("id") id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update post" })
  @ApiResponse({ status: 200, description: "Post updated successfully" })
  @ApiResponse({ status: 404, description: "Post not found" })
  update(
    @Param("id") id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    return this.postsService.update(
      id,
      updatePostDto,
      req.user.sub,
      req.user.role,
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete post" })
  @ApiResponse({ status: 200, description: "Post deleted successfully" })
  @ApiResponse({ status: 404, description: "Post not found" })
  remove(@Param("id") id: string, @Request() req) {
    return this.postsService.remove(id, req.user.sub, req.user.role);
  }
}
