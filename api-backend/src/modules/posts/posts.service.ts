import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto) {
    if (!createPostDto.isAnonymous && !createPostDto.authorName) {
      throw new BadRequestException('익명이 아닌 경우 작성자 이름이 필요합니다.');
    }

    const hashedPassword = await bcrypt.hash(createPostDto.password, 10);

    const post = this.postsRepository.create({
      ...createPostDto,
      password: hashedPassword,
    });

    const savedPost = await this.postsRepository.save(post);

    return {
      postId: savedPost.postId,
      message: `글이 작성되었습니다. 글 식별 번호를 잘 기억해주세요. 글 번호: ${savedPost.postId}`,
    };
  }

  async findAll(page: number = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    const [posts, total] = await this.postsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    const mappedPosts = posts.map((post) => {
      if (post.isPrivate) {
        return {
          id: post.id,
          postId: post.postId,
          title: post.title,
          isPrivate: true,
          authorName: this.maskAuthorName(post.authorName),
          createdAt: post.createdAt,
        };
      }
      return {
        id: post.id,
        postId: post.postId,
        title: post.title,
        content: post.content,
        email: post.email,
        authorName: post.isAnonymous ? null : post.authorName,
        isPrivate: post.isPrivate,
        isAnonymous: post.isAnonymous,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    return {
      data: mappedPosts,
      total,
      page,
      totalPages: Math.ceil(total / take),
    };
  }

  async findOne(id: string, password?: string) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    if (post.isPrivate) {
      if (!password) {
        throw new UnauthorizedException('비공개 글입니다. 비밀번호가 필요합니다.');
      }

      const isPasswordValid = await bcrypt.compare(password, post.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
      }
    }

    const { password: _, ...result } = post;
    return result;
  }

  async findByPostId(postId: number, password?: string) {
    const post = await this.postsRepository.findOne({ where: { postId } });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    if (post.isPrivate) {
      if (!password) {
        throw new UnauthorizedException('비공개 글입니다. 비밀번호가 필요합니다.');
      }

      const isPasswordValid = await bcrypt.compare(password, post.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
      }
    }

    const { password: _, ...result } = post;
    return result;
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    const isPasswordValid = await bcrypt.compare(updatePostDto.password, post.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    if (updatePostDto.isAnonymous === false && !updatePostDto.authorName && !post.authorName) {
      throw new BadRequestException('익명이 아닌 경우 작성자 이름이 필요합니다.');
    }

    const { password, ...updateData } = updatePostDto;
    Object.assign(post, updateData);

    await this.postsRepository.save(post);

    return { message: '글이 수정되었습니다.' };
  }

  async remove(id: string, password: string) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, post.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    await this.postsRepository.remove(post);

    return { message: '글이 삭제되었습니다.' };
  }

  async verifyPassword(id: string, password: string) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, post.password);

    return { valid: isPasswordValid };
  }

  private maskAuthorName(authorName: string | null): string {
    if (!authorName) return '익명';

    if (authorName.length === 1) return authorName;

    return authorName[0] + '*'.repeat(authorName.length - 1);
  }
}
