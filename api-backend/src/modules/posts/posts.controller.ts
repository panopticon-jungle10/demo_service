import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { DeletePostDto } from './dto/delete-post.dto';

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
  findByPostId(@Query('postId') postId: string, @Query('password') password?: string) {
    return this.postsService.findByPostId(parseInt(postId, 10), password);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('password') password?: string) {
    return this.postsService.findOne(id, password);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  verifyPassword(@Param('id') id: string, @Body() verifyPasswordDto: VerifyPasswordDto) {
    return this.postsService.verifyPassword(id, verifyPasswordDto.password);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Body() deletePostDto: DeletePostDto) {
    return this.postsService.remove(id, deletePostDto.password);
  }
}
