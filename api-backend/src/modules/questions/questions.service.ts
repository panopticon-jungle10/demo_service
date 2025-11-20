import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './questions.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async findAll(): Promise<Question[]> {
    return this.questionsRepository.find({
      relations: ['answers'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Question> {
    return this.questionsRepository.findOne({
      where: { id },
      relations: ['answers'],
    });
  }

  async create(content: string): Promise<Question> {
    const question = this.questionsRepository.create({ content });
    return this.questionsRepository.save(question);
  }
}
