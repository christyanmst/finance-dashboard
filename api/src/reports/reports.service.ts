import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { Response } from 'express';

import PDFKit from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  private getMonthName(month: number): string {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return months[month - 1] || '';
  }

  async getReportData(
    userId: number,
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
  ) {
    const startDate = new Date(
      Date.UTC(startYear, startMonth - 1, 1, 0, 0, 0, 0),
    );
    const lastDay = new Date(endYear, endMonth, 0).getDate();
    const endDate = new Date(
      Date.UTC(endYear, endMonth - 1, lastDay, 23, 59, 59, 999),
    );

    const gains = await this.prisma.gain.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const totalGains = gains.reduce((sum, gain) => sum + gain.amount, 0);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const balance = totalGains - totalExpenses;
    const gainCount = gains.length;
    const expenseCount = expenses.length;
    const avgGain = gainCount > 0 ? totalGains / gainCount : 0;
    const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    const monthlyData: {
      [key: string]: {
        month: string;
        gains: number;
        expenses: number;
        balance: number;
      };
    } = {};

    gains.forEach((gain) => {
      const date = new Date(gain.date);
      const month = date.getUTCMonth() + 1;
      const year = date.getUTCFullYear();
      const key = `${year}-${month}`;
      const monthLabel = `${this.getMonthName(month)}/${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: monthLabel,
          gains: 0,
          expenses: 0,
          balance: 0,
        };
      }

      monthlyData[key].gains += gain.amount;
    });

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const month = date.getUTCMonth() + 1;
      const year = date.getUTCFullYear();
      const key = `${year}-${month}`;
      const monthLabel = `${this.getMonthName(month)}/${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: monthLabel,
          gains: 0,
          expenses: 0,
          balance: 0,
        };
      }

      monthlyData[key].expenses += expense.amount;
    });

    Object.values(monthlyData).forEach((item) => {
      item.balance = item.gains - item.expenses;
    });

    const yearlyData: {
      [key: number]: {
        year: number;
        gains: number;
        expenses: number;
        balance: number;
      };
    } = {};

    gains.forEach((gain) => {
      const year = new Date(gain.date).getUTCFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          gains: 0,
          expenses: 0,
          balance: 0,
        };
      }
      yearlyData[year].gains += gain.amount;
    });

    expenses.forEach((expense) => {
      const year = new Date(expense.date).getUTCFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          gains: 0,
          expenses: 0,
          balance: 0,
        };
      }
      yearlyData[year].expenses += expense.amount;
    });

    Object.values(yearlyData).forEach((item) => {
      item.balance = item.gains - item.expenses;
    });

    const monthlyArray = Object.values(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      const months = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];
      const indexA = months.indexOf(monthA);
      const indexB = months.indexOf(monthB);
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      return indexA - indexB;
    });

    let trendAnalysis = null;
    if (monthlyArray.length >= 2) {
      const firstMonth = monthlyArray[0];
      const lastMonth = monthlyArray[monthlyArray.length - 1];

      let previousAvgGains = firstMonth.gains;
      let previousAvgExpenses = firstMonth.expenses;
      let recentAvgGains = lastMonth.gains;
      let recentAvgExpenses = lastMonth.expenses;

      if (monthlyArray.length >= 6) {
        const firstThreeMonths = monthlyArray.slice(0, 3);
        const lastThreeMonths = monthlyArray.slice(-3);

        previousAvgGains =
          firstThreeMonths.reduce((sum, m) => sum + m.gains, 0) /
          firstThreeMonths.length;
        previousAvgExpenses =
          firstThreeMonths.reduce((sum, m) => sum + m.expenses, 0) /
          firstThreeMonths.length;
        recentAvgGains =
          lastThreeMonths.reduce((sum, m) => sum + m.gains, 0) /
          lastThreeMonths.length;
        recentAvgExpenses =
          lastThreeMonths.reduce((sum, m) => sum + m.expenses, 0) /
          lastThreeMonths.length;
      } else if (monthlyArray.length >= 3) {
        const lastTwoMonths = monthlyArray.slice(-2);
        recentAvgGains =
          lastTwoMonths.reduce((sum, m) => sum + m.gains, 0) /
          lastTwoMonths.length;
        recentAvgExpenses =
          lastTwoMonths.reduce((sum, m) => sum + m.expenses, 0) /
          lastTwoMonths.length;
      }

      let gainsTrend = 0;
      let expensesTrend = 0;

      if (previousAvgGains > 0) {
        gainsTrend =
          ((recentAvgGains - previousAvgGains) / previousAvgGains) * 100;
      } else if (recentAvgGains > 0) {
        gainsTrend = 100;
      }

      if (previousAvgExpenses > 0) {
        expensesTrend =
          ((recentAvgExpenses - previousAvgExpenses) / previousAvgExpenses) *
          100;
      } else if (recentAvgExpenses > 0) {
        expensesTrend = 100;
      }

      gainsTrend = Math.round(gainsTrend * 10) / 10;
      expensesTrend = Math.round(expensesTrend * 10) / 10;

      if (isNaN(gainsTrend) || !isFinite(gainsTrend)) {
        gainsTrend = 0;
      }
      if (isNaN(expensesTrend) || !isFinite(expensesTrend)) {
        expensesTrend = 0;
      }

      trendAnalysis = {
        gainsTrend,
        expensesTrend,
      };
    }

    return {
      summary: {
        totalGains,
        totalExpenses,
        balance,
        gainCount,
        expenseCount,
        avgGain,
        avgExpense,
      },
      monthlyData: monthlyArray,
      yearlyData: Object.values(yearlyData).sort((a, b) => a.year - b.year),
      trendAnalysis,
      gains,
      expenses,
      period: {
        startMonth,
        startYear,
        endMonth,
        endYear,
      },
    };
  }

  async generatePDF(
    userId: number,
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    res: Response,
  ) {
    const data = await this.getReportData(
      userId,
      startMonth,
      startYear,
      endMonth,
      endYear,
    );

    const doc = new (PDFKit as any)({ margin: 50 });

    const fileName = `relatorio_${startMonth}_${startYear}_${endMonth}_${endYear}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor('#F7931B')
      .text('Relatório Financeiro', { align: 'center' });
    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor('black')
      .text(
        `Período: ${this.getMonthName(startMonth)}/${startYear} a ${this.getMonthName(endMonth)}/${endYear}`,
        { align: 'center' },
      );
    doc.moveDown(2);

    doc.fontSize(16).fillColor('black').text('Resumo Financeiro');
    doc.moveDown();

    doc.fontSize(11).fillColor('black');
    doc.text(
      `Total de Entradas: ${this.formatCurrency(data.summary.totalGains)}`,
      { indent: 20 },
    );
    doc.text(
      `Total de Saídas: ${this.formatCurrency(data.summary.totalExpenses)}`,
      { indent: 20 },
    );
    doc.text(`Saldo: ${this.formatCurrency(data.summary.balance)}`, {
      indent: 20,
    });
    doc.text(
      `Média por Entrada: ${this.formatCurrency(data.summary.avgGain)}`,
      { indent: 20 },
    );
    doc.text(
      `Média por Saída: ${this.formatCurrency(data.summary.avgExpense)}`,
      { indent: 20 },
    );
    doc.text(`Quantidade de Entradas: ${data.summary.gainCount}`, {
      indent: 20,
    });
    doc.text(`Quantidade de Saídas: ${data.summary.expenseCount}`, {
      indent: 20,
    });
    doc.moveDown();

    if (data.trendAnalysis) {
      doc.fontSize(16).fillColor('black').text('Análise de Tendências');
      doc.moveDown();
      doc.fontSize(11).fillColor('black');
      doc.text(
        `Variação de Entradas: ${data.trendAnalysis.gainsTrend >= 0 ? '+' : ''}${data.trendAnalysis.gainsTrend.toFixed(1)}%`,
        { indent: 20 },
      );
      doc.text(
        `Variação de Saídas: ${data.trendAnalysis.expensesTrend >= 0 ? '+' : ''}${data.trendAnalysis.expensesTrend.toFixed(1)}%`,
        { indent: 20 },
      );
      doc.moveDown();
    }

    if (data.monthlyData.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('black').text('Evolução Mensal');
      doc.moveDown();

      doc.fontSize(10).fillColor('black');
      data.monthlyData.forEach((item) => {
        doc.text(`${item.month}:`, { indent: 20 });
        doc.text(`  Entradas: ${this.formatCurrency(item.gains)}`, {
          indent: 40,
        });
        doc.text(`  Saídas: ${this.formatCurrency(item.expenses)}`, {
          indent: 40,
        });
        doc.text(`  Saldo: ${this.formatCurrency(item.balance)}`, {
          indent: 40,
        });
        doc.moveDown(0.5);
      });
    }

    if (data.yearlyData.length > 1) {
      doc.addPage();
      doc.fontSize(16).fillColor('black').text('Comparativo Ano a Ano');
      doc.moveDown();

      doc.fontSize(10).fillColor('black');
      data.yearlyData.forEach((item) => {
        doc.text(`${item.year}:`, { indent: 20 });
        doc.text(`  Entradas: ${this.formatCurrency(item.gains)}`, {
          indent: 40,
        });
        doc.text(`  Saídas: ${this.formatCurrency(item.expenses)}`, {
          indent: 40,
        });
        doc.text(`  Saldo: ${this.formatCurrency(item.balance)}`, {
          indent: 40,
        });
        doc.moveDown(0.5);
      });
    }

    if (data.gains.length > 0) {
      if (doc.y > 700) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }
      doc.fontSize(16).fillColor('black').text('Detalhamento de Entradas');
      doc.moveDown();

      doc.fontSize(9).fillColor('black');
      data.gains.slice(0, 100).forEach((gain) => {
        if (doc.y > 750) {
          doc.addPage();
        }
        doc.text(
          `${this.formatDate(gain.date)} - ${gain.description} - ${this.formatCurrency(gain.amount)} - ${gain.type} - ${gain.frequency}`,
          { indent: 20 },
        );
      });
    }

    if (data.expenses.length > 0) {
      if (doc.y > 700) {
        doc.addPage();
      } else {
        doc.moveDown(2);
      }
      doc.fontSize(16).fillColor('black').text('Detalhamento de Saídas');
      doc.moveDown();

      doc.fontSize(9).fillColor('black');
      data.expenses.slice(0, 100).forEach((expense) => {
        if (doc.y > 750) {
          doc.addPage();
        }
        doc.text(
          `${this.formatDate(expense.date)} - ${expense.description} - ${this.formatCurrency(expense.amount)} - ${expense.type} - ${expense.frequency}`,
          { indent: 20 },
        );
      });
    }

    doc.end();
  }

  async generateExcel(
    userId: number,
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    res: Response,
  ) {
    const data = await this.getReportData(
      userId,
      startMonth,
      startYear,
      endMonth,
      endYear,
    );

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ['Resumo Financeiro'],
      [
        'Período',
        `${this.getMonthName(startMonth)}/${startYear} a ${this.getMonthName(endMonth)}/${endYear}`,
      ],
      [''],
      ['Item', 'Valor', 'Detalhes'],
      [
        'Total de Entradas',
        data.summary.totalGains,
        `${data.summary.gainCount} transações`,
      ],
      [
        'Total de Saídas',
        data.summary.totalExpenses,
        `${data.summary.expenseCount} transações`,
      ],
      [
        'Saldo',
        data.summary.balance,
        data.summary.balance >= 0 ? 'Positivo' : 'Negativo',
      ],
      ['Média por Entrada', data.summary.avgGain, ''],
      ['Média por Saída', data.summary.avgExpense, ''],
    ];

    // Adiciona análise de tendências se disponível
    if (data.trendAnalysis) {
      summaryData.push(['']);
      summaryData.push(['Análise de Tendências']);
      summaryData.push([
        'Variação de Entradas',
        `${data.trendAnalysis.gainsTrend >= 0 ? '+' : ''}${data.trendAnalysis.gainsTrend.toFixed(1)}%`,
        '',
      ]);
      summaryData.push([
        'Variação de Saídas',
        `${data.trendAnalysis.expensesTrend >= 0 ? '+' : ''}${data.trendAnalysis.expensesTrend.toFixed(1)}%`,
        '',
      ]);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // Dados Mensais
    if (data.monthlyData.length > 0) {
      const monthlyHeaders = [['Mês', 'Entradas', 'Saídas', 'Saldo']];
      const monthlyRows = data.monthlyData.map((item) => [
        item.month,
        item.gains,
        item.expenses,
        item.balance,
      ]);
      const monthlyData = [...monthlyHeaders, ...monthlyRows];
      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Evolução Mensal');
    }

    // Comparativo Ano a Ano
    if (data.yearlyData.length > 0) {
      const yearlyHeaders = [['Ano', 'Entradas', 'Saídas', 'Saldo']];
      const yearlyRows = data.yearlyData.map((item) => [
        item.year,
        item.gains,
        item.expenses,
        item.balance,
      ]);
      const yearlyData = [...yearlyHeaders, ...yearlyRows];
      const yearlySheet = XLSX.utils.aoa_to_sheet(yearlyData);
      XLSX.utils.book_append_sheet(workbook, yearlySheet, 'Comparativo Anual');
    }

    // Entradas
    if (data.gains.length > 0) {
      const gainsHeaders = [
        ['Descrição', 'Valor', 'Tipo', 'Frequência', 'Data'],
      ];
      const gainsRows = data.gains.map((gain) => [
        gain.description,
        gain.amount,
        gain.type,
        gain.frequency,
        this.formatDate(gain.date),
      ]);
      const gainsData = [...gainsHeaders, ...gainsRows];
      const gainsSheet = XLSX.utils.aoa_to_sheet(gainsData);
      XLSX.utils.book_append_sheet(workbook, gainsSheet, 'Entradas');
    }

    if (data.expenses.length > 0) {
      const expensesHeaders = [
        ['Descrição', 'Valor', 'Tipo', 'Frequência', 'Data'],
      ];
      const expensesRows = data.expenses.map((expense) => [
        expense.description,
        expense.amount,
        expense.type,
        expense.frequency,
        this.formatDate(expense.date),
      ]);
      const expensesData = [...expensesHeaders, ...expensesRows];
      const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Saídas');
    }

    const fileName = `relatorio_${startMonth}_${startYear}_${endMonth}_${endYear}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
  }

  async generateCSV(
    userId: number,
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    type: 'gains' | 'expenses',
    res: Response,
  ) {
    const data = await this.getReportData(
      userId,
      startMonth,
      startYear,
      endMonth,
      endYear,
    );

    let csv = '';
    let fileName = '';

    if (type === 'gains') {
      csv = 'Descrição,Valor,Tipo,Frequência,Data\n';
      data.gains.forEach((gain) => {
        csv += `"${gain.description}",${gain.amount},"${gain.type}","${gain.frequency}","${this.formatDate(gain.date)}"\n`;
      });
      fileName = `entradas_${startMonth}_${startYear}_${endMonth}_${endYear}.csv`;
    } else {
      csv = 'Descrição,Valor,Tipo,Frequência,Data\n';
      data.expenses.forEach((expense) => {
        csv += `"${expense.description}",${expense.amount},"${expense.type}","${expense.frequency}","${this.formatDate(expense.date)}"\n`;
      });
      fileName = `saidas_${startMonth}_${startYear}_${endMonth}_${endYear}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\ufeff' + csv); // BOM para Excel reconhecer UTF-8
  }
}
