import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { randomUUID } from 'crypto';

interface CreateInstallmentPayload {
  description: string;
  amount: number;
  type: string;
  frequency: string;
  date: Date;
  installmentNumber: number;
  installmentTotal: number;
}

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private generateInstallmentDates(baseDate: Date, count: number): Date[] {
    const dates: Date[] = [];

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate);
      date.setUTCMonth(date.getUTCMonth() + i);
      dates.push(date);
    }

    return dates;
  }

  private distributeAmounts(
    totalAmount: number,
    installmentCount: number,
  ): number[] {
    const centsTotal = Math.round(totalAmount * 100);
    const baseAmount = Math.floor(centsTotal / installmentCount);
    const remainder = centsTotal - baseAmount * installmentCount;

    const amounts = Array(installmentCount)
      .fill(0)
      .map((_, index) => {
        const cents = baseAmount + (index < remainder ? 1 : 0);
        return cents / 100;
      });

    return amounts;
  }

  async create(userId: number, createExpenseDto: CreateExpenseDto) {
    const isInstallment = createExpenseDto.isInstallment;
    const installmentCount = createExpenseDto.installmentCount;
    const firstInstallmentThisMonth =
      createExpenseDto.firstInstallmentThisMonth ?? true;

    if (isInstallment && (!installmentCount || installmentCount < 2)) {
      throw new BadRequestException(
        'Compras parceladas devem ter no mínimo 2 parcelas',
      );
    }

    if (isInstallment && installmentCount) {
      const totalAmount = createExpenseDto.amount;
      const groupId = randomUUID();
      const baseDate = new Date(createExpenseDto.date);

      if (!firstInstallmentThisMonth) {
        baseDate.setUTCMonth(baseDate.getUTCMonth() + 1);
      }

      const dates = this.generateInstallmentDates(baseDate, installmentCount);
      const amounts = this.distributeAmounts(totalAmount, installmentCount);

      const installmentsPayload = dates.map((date, index) => ({
        description: createExpenseDto.description,
        amount: amounts[index],
        type: createExpenseDto.type,
        frequency: createExpenseDto.frequency,
        date,
        installmentNumber: index + 1,
        installmentTotal: installmentCount,
      }));

      const createdInstallments = await this.createInstallmentExpenses(
        userId,
        groupId,
        totalAmount,
        installmentsPayload,
      );

      return {
        message: 'Compra parcelada registrada com sucesso',
        installments: createdInstallments,
      };
    }

    const expense = await this.prisma.expense.create({
      data: {
        description: createExpenseDto.description,
        amount: createExpenseDto.amount,
        type: createExpenseDto.type,
        frequency: createExpenseDto.frequency,
        date: new Date(createExpenseDto.date),
        userId,
        isInstallment: false,
        installmentGroupId: null,
        installmentNumber: null,
        installmentTotal: null,
        originalAmount: null,
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        isInstallment: true,
        installmentGroupId: true,
        installmentNumber: true,
        installmentTotal: true,
        originalAmount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return expense;
  }

  private async createInstallmentExpenses(
    userId: number,
    groupId: string,
    totalAmount: number,
    payloads: CreateInstallmentPayload[],
  ) {
    const installmentPromises = payloads.map((installment) =>
      this.prisma.expense.create({
        data: {
          description: installment.description,
          amount: installment.amount,
          type: installment.type,
          frequency: installment.frequency,
          date: installment.date,
          userId,
          isInstallment: true,
          installmentGroupId: groupId,
          installmentNumber: installment.installmentNumber,
          installmentTotal: installment.installmentTotal,
          originalAmount: totalAmount,
        },
        select: {
          id: true,
          description: true,
          amount: true,
          type: true,
          frequency: true,
          date: true,
          userId: true,
          isInstallment: true,
          installmentGroupId: true,
          installmentNumber: true,
          installmentTotal: true,
          originalAmount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );

    return this.prisma.$transaction(installmentPromises);
  }

  async findAll(userId: number) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        isInstallment: true,
        installmentGroupId: true,
        installmentNumber: true,
        installmentTotal: true,
        originalAmount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return expenses;
  }

  async findOne(id: number, userId: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        isInstallment: true,
        installmentGroupId: true,
        installmentNumber: true,
        installmentTotal: true,
        originalAmount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Saída com ID ${id} não encontrada`);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta saída',
      );
    }

    return expense;
  }

  async update(id: number, userId: number, updateExpenseDto: UpdateExpenseDto) {
    const existingExpense = await this.findOne(id, userId);

    if (existingExpense.isInstallment) {
      const hasInstallmentCount =
        'installmentCount' in updateExpenseDto &&
        updateExpenseDto.installmentCount !== undefined;
      const hasIsInstallment =
        'isInstallment' in updateExpenseDto &&
        updateExpenseDto.isInstallment !== undefined;
      const hasFirstInstallmentFlag =
        'firstInstallmentThisMonth' in updateExpenseDto &&
        updateExpenseDto.firstInstallmentThisMonth !== undefined;

      if (hasInstallmentCount || hasIsInstallment || hasFirstInstallmentFlag) {
        throw new BadRequestException(
          'Não é permitido alterar a estrutura de uma parcela. Atualize apenas campos básicos.',
        );
      }
    }

    const { rest } = updateExpenseDto as Record<string, any>;

    if (rest.date) {
      rest.date = new Date(rest.date);
    }

    const expense = await this.prisma.expense.update({
      where: { id },
      data: rest,
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        frequency: true,
        date: true,
        userId: true,
        isInstallment: true,
        installmentGroupId: true,
        installmentNumber: true,
        installmentTotal: true,
        originalAmount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return expense;
  }

  async remove(id: number, userId: number) {
    const expense = await this.findOne(id, userId);

    if (expense.isInstallment && expense.installmentGroupId) {
      await this.prisma.expense.deleteMany({
        where: {
          installmentGroupId: expense.installmentGroupId,
          userId,
        },
      });

      return { message: 'Compra parcelada removida com sucesso' };
    }

    await this.prisma.expense.delete({
      where: { id },
    });

    return { message: 'Saída removida com sucesso' };
  }
}
