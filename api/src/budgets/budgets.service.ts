import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createBudgetDto: CreateBudgetDto) {
    // Verifica se já existe um orçamento para o mesmo tipo, mês e ano
    const existingBudget = await this.prisma.budget.findUnique({
      where: {
        userId_type_month_year: {
          userId,
          type: createBudgetDto.type,
          month: createBudgetDto.month,
          year: createBudgetDto.year,
        },
      },
    });

    if (existingBudget) {
      throw new ConflictException(
        `Já existe um orçamento para o tipo "${createBudgetDto.type}" no mês ${createBudgetDto.month}/${createBudgetDto.year}`,
      );
    }

    const budget = await this.prisma.budget.create({
      data: {
        ...createBudgetDto,
        userId,
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        month: true,
        year: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return budget;
  }

  async findAll(userId: number, month?: number, year?: number) {
    const where: any = {
      userId,
    };

    if (month !== undefined && year !== undefined) {
      where.month = month;
      where.year = year;
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { type: 'asc' }],
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        month: true,
        year: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return budgets;
  }

  async findOne(id: number, userId: number) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        month: true,
        year: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!budget) {
      throw new NotFoundException(`Orçamento com ID ${id} não encontrado`);
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este orçamento',
      );
    }

    return budget;
  }

  async update(id: number, userId: number, updateBudgetDto: UpdateBudgetDto) {
    const existingBudget = await this.findOne(id, userId);

    if (updateBudgetDto.type || updateBudgetDto.month || updateBudgetDto.year) {
      const checkType = updateBudgetDto.type ?? existingBudget.type;
      const checkMonth = updateBudgetDto.month ?? existingBudget.month;
      const checkYear = updateBudgetDto.year ?? existingBudget.year;

      const duplicateBudget = await this.prisma.budget.findUnique({
        where: {
          userId_type_month_year: {
            userId,
            type: checkType,
            month: checkMonth,
            year: checkYear,
          },
        },
      });

      if (duplicateBudget && duplicateBudget.id !== id) {
        throw new ConflictException(
          `Já existe um orçamento para o tipo "${checkType}" no mês ${checkMonth}/${checkYear}`,
        );
      }
    }

    const budget = await this.prisma.budget.update({
      where: { id },
      data: updateBudgetDto,
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        month: true,
        year: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return budget;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    await this.prisma.budget.delete({
      where: { id },
    });

    return { message: 'Orçamento removido com sucesso' };
  }

  async getBudgetStatus(
    userId: number,
    month: number,
    year: number,
    type: string,
  ) {
    const budget = await this.prisma.budget.findUnique({
      where: {
        userId_type_month_year: {
          userId,
          type,
          month,
          year,
        },
      },
    });

    if (!budget) {
      return null;
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = new Date(
      Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999),
    );

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        type,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        frequency: true,
        isInstallment: true,
        installmentNumber: true,
        installmentTotal: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const totalSpent = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const remaining = budget.amount - totalSpent;
    const percentageUsed = (totalSpent / budget.amount) * 100;
    const percentageRemaining = (remaining / budget.amount) * 100;

    return {
      budget: {
        id: budget.id,
        description: budget.description,
        amount: budget.amount,
        type: budget.type,
        month: budget.month,
        year: budget.year,
      },
      expenses,
      totalSpent,
      remaining,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      percentageRemaining: Math.round(percentageRemaining * 100) / 100,
      isOverBudget: totalSpent > budget.amount,
      isNearLimit: percentageUsed >= 80 && percentageUsed < 100,
    };
  }

  async getAllBudgetsStatus(userId: number, month: number, year: number) {
    const budgets = await this.findAll(userId, month, year);
    const statuses = await Promise.all(
      budgets.map((budget) =>
        this.getBudgetStatus(userId, month, year, budget.type),
      ),
    );

    return statuses.filter((status) => status !== null);
  }
}
