import { Controller, Post, Body, Param } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { Answer } from './answers.entity';

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  async create(
    @Body() createDto: { questionId: string; question: string },
  ): Promise<Answer> {
    return this.answersService.createAnswer(
      createDto.questionId,
      createDto.question,
    );
  }
}
