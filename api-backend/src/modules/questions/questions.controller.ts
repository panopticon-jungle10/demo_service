import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Question } from './questions.entity';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async findAll(): Promise<Question[]> {
    return this.questionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Question> {
    return this.questionsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: { content: string },
  ): Promise<Question> {
    return this.questionsService.create(createDto.content);
  }
}
