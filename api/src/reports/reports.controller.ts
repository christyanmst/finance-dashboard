import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pdf')
  async generatePDF(
    @Request() req,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    try {
      await this.reportsService.generatePDF(
        req.user.id,
        query.startMonth,
        query.startYear,
        query.endMonth,
        query.endYear,
        res,
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      res.status(500).json({ message: 'Erro ao gerar PDF' });
    }
  }

  @Get('excel')
  async generateExcel(
    @Request() req,
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    try {
      await this.reportsService.generateExcel(
        req.user.id,
        query.startMonth,
        query.startYear,
        query.endMonth,
        query.endYear,
        res,
      );
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      res.status(500).json({ message: 'Erro ao gerar Excel' });
    }
  }

  @Get('csv/:type')
  async generateCSV(
    @Request() req,
    @Query() query: ReportQueryDto,
    @Param('type') type: string,
    @Res() res: Response,
  ) {
    if (type !== 'gains' && type !== 'expenses') {
      return res
        .status(400)
        .json({ message: 'Tipo deve ser "gains" ou "expenses"' });
    }

    try {
      await this.reportsService.generateCSV(
        req.user.id,
        query.startMonth,
        query.startYear,
        query.endMonth,
        query.endYear,
        type as 'gains' | 'expenses',
        res,
      );
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      res.status(500).json({ message: 'Erro ao gerar CSV' });
    }
  }
}
