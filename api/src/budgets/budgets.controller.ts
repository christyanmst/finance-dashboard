import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(@Request() req, @Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetsService.create(req.user.id, createBudgetDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.budgetsService.findAll(req.user.id, monthNum, yearNum);
  }

  @Get('status')
  getStatus(
    @Request() req,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    return this.budgetsService.getAllBudgetsStatus(
      req.user.id,
      monthNum,
      yearNum,
    );
  }

  @Get('status/:type')
  getStatusByType(
    @Request() req,
    @Param('type') type: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    return this.budgetsService.getBudgetStatus(
      req.user.id,
      monthNum,
      yearNum,
      type,
    );
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.budgetsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, req.user.id, updateBudgetDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.budgetsService.remove(id, req.user.id);
  }
}
