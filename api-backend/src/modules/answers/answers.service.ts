import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Answer } from './answers.entity';

@Injectable()
export class AnswersService {
  constructor(
    @InjectRepository(Answer)
    private answersRepository: Repository<Answer>,
    private httpService: HttpService,
  ) {}

  async createAnswer(questionId: string, question: string): Promise<Answer> {
    const llmBackendUrl = process.env.LLM_BACKEND_URL || 'http://localhost:8001';

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${llmBackendUrl}/generate`, {
          question,
        }),
      );

      const answer = this.answersRepository.create({
        questionId,
        content: response.data.answer,
      });

      return this.answersRepository.save(answer);
    } catch (error) {
      console.error('Error calling LLM backend:', error);
      throw error;
    }
  }
}
