import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get()
  findAll(@Query('page') page?: string) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    return this.postsService.findAll(pageNumber);
  }

  @Get('search')
  findByPostId(@Query('postId') postId: string) {
    return this.postsService.findByPostId(parseInt(postId, 10));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post(':id/admin-access')
  @HttpCode(HttpStatus.OK)
  adminAccessPost(@Param('id') id: string, @Body() body: { adminPassword: string }) {
    return this.postsService.findOneAsAdmin(id, body.adminPassword);
  }

  @Post('verify-admin')
  @HttpCode(HttpStatus.OK)
  verifyAdmin(@Body() body: { adminPassword: string }) {
    return this.postsService.verifyAdmin(body.adminPassword);
  }
}
