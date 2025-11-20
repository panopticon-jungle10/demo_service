import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  private verifyAdminPassword(password: string): void {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
      throw new ForbiddenException('관리자 권한이 필요합니다');
    }
  }

  async create(postId: string, createCommentDto: CreateCommentDto) {
    this.verifyAdminPassword(createCommentDto.adminPassword);

    const comment = this.commentsRepository.create({
      postId,
      content: createCommentDto.content,
      isAiGenerated: createCommentDto.isAiGenerated,
    });

    const savedComment = await this.commentsRepository.save(comment);

    return {
      id: savedComment.id,
      message: '댓글이 작성되었습니다',
    };
  }

  async update(id: string, updateCommentDto: UpdateCommentDto) {
    this.verifyAdminPassword(updateCommentDto.adminPassword);

    const comment = await this.commentsRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다');
    }

    comment.content = updateCommentDto.content;
    await this.commentsRepository.save(comment);

    return { message: '댓글이 수정되었습니다' };
  }

  async remove(id: string, adminPassword: string) {
    this.verifyAdminPassword(adminPassword);

    const comment = await this.commentsRepository.findOne({ where: { id } });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다');
    }

    await this.commentsRepository.remove(comment);

    return { message: '댓글이 삭제되었습니다' };
  }
}
