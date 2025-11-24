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
    if (!createPostDto.authorName || !createPostDto.authorName.trim()) {
      throw new BadRequestException('작성자 이름이 필요합니다.');
    }

    const hashedPassword = await bcrypt.hash(createPostDto.password, 10);

    const post = this.postsRepository.create({
      ...createPostDto,
      password: hashedPassword,
    });

    const savedPost = await this.postsRepository.save(post);

    return {
      id: savedPost.id,
      postId: savedPost.postId,
      message: `생성번호는 답변확인과 수정시 필요합니다. 생성번호: ${savedPost.postId}`,
    };
  }

  async findAll(page: number = 1) {
    const take = 20;
    const skip = (page - 1) * take;

    const [posts, total] = await this.postsRepository.findAndCount({
      relations: ['comments'],
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    const mappedPosts = posts.map((post) => {
      const maskedName = post.isAnonymous
        ? this.maskAuthorNameMiddle(post.authorName)
        : post.authorName;

      if (post.isPrivate) {
        return {
          id: post.id,
          postId: post.postId,
          title: post.title,
          isPrivate: true,
          authorName: maskedName,
          createdAt: post.createdAt,
          comments: post.comments,
        };
      }
      return {
        id: post.id,
        postId: post.postId,
        title: post.title,
        content: post.content,
        email: post.email,
        authorName: maskedName,
        isPrivate: post.isPrivate,
        isAnonymous: post.isAnonymous,
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

  async findOne(id: string, password?: string) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['comments'],
    });

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

    if (!updatePostDto.authorName || !updatePostDto.authorName.trim()) {
      throw new BadRequestException('작성자 이름이 필요합니다.');
    }

    const { password, ...updateData } = updatePostDto;
    Object.assign(post, updateData);

    await this.postsRepository.save(post);

    return { message: '글이 수정되었습니다.' };
  }

  private maskAuthorNameMiddle(authorName: string | null): string {
    if (!authorName) return '익명';

    if (authorName.length === 1) return authorName;
    if (authorName.length === 2) return authorName[0] + '*';

    const mid = Math.floor(authorName.length / 2);
    return '*'.repeat(mid) + authorName[mid] + '*'.repeat(authorName.length - mid - 1);
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
