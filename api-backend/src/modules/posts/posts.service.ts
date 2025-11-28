import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  LoggerService,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async create(createPostDto: CreatePostDto) {
    // MAX(postId) + 1 방식으로 postId 생성
    const maxPostIdResult = await this.postsRepository
      .createQueryBuilder('post')
      .select('MAX(post.postId)', 'maxPostId')
      .getRawOne();

    const nextPostId = (maxPostIdResult?.maxPostId || 0) + 1;

    const post = this.postsRepository.create({
      ...createPostDto,
      postId: nextPostId,
      password: '',
      title: null,
      authorName: 'JUNGLE',
      isPrivate: false,
      isAnonymous: false,
    });

    const savedPost = await this.postsRepository.save(post);

    return {
      id: savedPost.id,
      postId: savedPost.postId,
      message: `글이 작성되었습니다. 생성번호: ${savedPost.postId}`,
    };
  }

  async findAll(page: number = 1) {
    const take = 10;
    const skip = (page - 1) * take;

    const [posts, total] = await this.postsRepository.findAndCount({
      relations: ['comments'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    const mappedPosts = posts.map((post) => {
      // 내용의 첫 50자를 미리보기로 사용
      const contentPreview = post.content?.substring(0, 50) || '';

      // 기존 게시글은 title 사용, 새 게시글은 내용 미리보기 사용
      const displayTitle = post.title || contentPreview;

      return {
        id: post.id,
        postId: post.postId,
        title: displayTitle,
        content: post.content,
        email: post.email,
        isPrivate: post.isPrivate,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        comments: post.comments,
      };
    });

    return {
      data: mappedPosts,
      total,
      page,
      totalPages: Math.ceil(total / take),
    };
  }

  async findOne(id: string) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['comments'],
    });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    const { password: _, ...result } = post;
    return result;
  }

  async findOneAsAdmin(id: string, adminPassword: string) {
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    if (!envAdminPassword || adminPassword !== envAdminPassword) {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }

    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['comments'],
    });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    const { password: _, ...result } = post;
    return result;
  }

  async findByPostId(postId: number) {
    const post = await this.postsRepository.findOne({ where: { postId } });

    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    const { password: _, ...result } = post;
    return result;
  }

  async getAllCount() {
    return await this.postsRepository.count();
  }

  async verifyAdmin(adminPassword: string) {
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    if (!envAdminPassword || adminPassword !== envAdminPassword) {
      throw new UnauthorizedException('관리자 권한이 필요합니다.');
    }
    return { message: '인증되었습니다.' };
  }
}
